"use client";

import React, { useEffect, useRef, useState, type ChangeEvent } from "react";
import { abrirCamara, cerrarCamara, type MediaStreamLike } from "../lib/device/camera";
import { obtenerUbicacion, type Ubicacion } from "../lib/device/geolocation";
import { comprimirArchivo, comprimirVideo } from "../lib/device/image";
import { leerPermiso, pedirPermiso, type PermisoNotif } from "../lib/notifications/client";

type Props = {
  photo?: string;
  geo?: Ubicacion;
  onPhoto: (dataUrl: string | undefined) => void;
  onGeo: (geo: Ubicacion | undefined) => void;
};

/**
 * Evidencia opcional del formulario: foto, ubicación y recordatorios.
 * Nada se solicita al cargar: cada permiso se pide solo al pulsar su botón,
 * y cada capacidad tiene alternativa si el navegador no la ofrece o el usuario la niega.
 */
export function DevicePanel({ photo, geo, onPhoto, onGeo }: Props) {
  const [aviso, setAviso] = useState("");
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [permiso, setPermiso] = useState<PermisoNotif | "unsupported">("default");
  const [buscando, setBuscando] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStreamLike | null>(null);

  useEffect(() => {
    setPermiso(leerPermiso()); // solo lee, no pide
    return () => {
      cerrarCamara(streamRef.current);
    };
  }, []);

  useEffect(() => {
    if (camaraActiva && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current as unknown as MediaStream;
    }
  }, [camaraActiva]);

  function detenerCamara() {
    cerrarCamara(streamRef.current);
    streamRef.current = null;
    setCamaraActiva(false);
  }

  async function abrir() {
    setAviso("");
    const r = await abrirCamara();
    if (r.status !== "ok") {
      setAviso(r.reason);
      return;
    }
    streamRef.current = r.data;
    setCamaraActiva(true);
  }

  function capturar() {
    if (!videoRef.current) return;
    const r = comprimirVideo(videoRef.current);
    detenerCamara();
    if (r.status === "ok") {
      onPhoto(r.data);
      setAviso("");
    } else setAviso(r.reason);
  }

  async function alElegirArchivo(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const r = await comprimirArchivo(file);
    if (r.status === "ok") {
      onPhoto(r.data);
      setAviso("");
    } else setAviso(r.reason);
  }

  async function usarUbicacion() {
    setAviso("");
    setBuscando(true);
    const r = await obtenerUbicacion();
    setBuscando(false);
    if (r.status === "ok") onGeo(r.data);
    else setAviso(r.reason);
  }

  async function activarRecordatorios() {
    const r = await pedirPermiso();
    setPermiso(leerPermiso());
    setAviso(
      r.status === "ok"
        ? "Recordatorios activados. Te avisaremos cuando guardes una inspección sin conexión."
        : r.reason
    );
  }

  return (
    <fieldset className="device-panel form-wide">
      <legend>Evidencia y avisos (opcional)</legend>

      <div className="device-row">
        {!camaraActiva && (
          <button type="button" className="dev-btn" onClick={() => void abrir()}>
            Tomar foto
          </button>
        )}
        <label className="dev-btn dev-file">
          Adjuntar foto
          <input type="file" accept="image/*" capture="environment" onChange={(e) => void alElegirArchivo(e)} />
        </label>
        <button type="button" className="dev-btn" onClick={() => void usarUbicacion()} disabled={buscando}>
          {buscando ? "Buscando…" : "Usar mi ubicación"}
        </button>
        {permiso !== "granted" && permiso !== "unsupported" && (
          <button type="button" className="dev-btn" onClick={() => void activarRecordatorios()}>
            Activar recordatorios
          </button>
        )}
      </div>

      {camaraActiva && (
        <div className="camera-box">
          <video ref={videoRef} autoPlay playsInline muted aria-label="Vista previa de la cámara" />
          <div className="device-row">
            <button type="button" className="dev-btn" onClick={capturar}>
              Capturar
            </button>
            <button type="button" className="dev-btn dev-quiet" onClick={detenerCamara}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {photo && (
        <div className="device-result">
          <img src={photo} alt="Foto adjunta a la inspección" className="photo-preview" />
          <button type="button" className="dev-btn dev-quiet" onClick={() => onPhoto(undefined)}>
            Quitar foto
          </button>
        </div>
      )}

      {geo && (
        <p className="device-result">
          Ubicación aproximada: {geo.lat}, {geo.lon} (±{geo.precisionM} m){" "}
          <button type="button" className="dev-btn dev-quiet" onClick={() => onGeo(undefined)}>
            Quitar
          </button>
        </p>
      )}

      {aviso && (
        <p role="status" className="device-notice">
          {aviso}
        </p>
      )}
      {permiso === "unsupported" && (
        <p className="muted">Este navegador no soporta notificaciones; los avisos se muestran dentro de la app.</p>
      )}
    </fieldset>
  );
}
