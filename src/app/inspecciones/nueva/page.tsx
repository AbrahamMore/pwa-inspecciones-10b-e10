"use client";

import React, { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { inspections } from "../../../lib/data/inspections";
import { useSync } from "../../../components/sync-provider";
import { validarPayload } from "../../../lib/sync/validation";
import { ETIQUETAS_SYNC } from "../../../lib/sync/labels";
import { DevicePanel } from "../../../components/device-panel";
import { mostrarRecordatorio } from "../../../lib/notifications/client";
import type { Ubicacion } from "../../../lib/device/geolocation";

const laboratorios = Array.from(new Set(inspections.map((i) => i.location)));

function fechaLocalHoy(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function NuevaInspeccionPage() {
  const { items, online, syncing, agregar, sincronizar } = useSync();
  const [fecha, setFecha] = useState("");
  const [errores, setErrores] = useState<string[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [geo, setGeo] = useState<Ubicacion | undefined>();

  useEffect(() => setFecha(fechaLocalHoy()), []);

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const datos = new FormData(form);
    const campo = (nombre: string) => String(datos.get(nombre) ?? "").trim();

    const payload = {
      location: campo("location"),
      date: fecha,
      inspector: campo("inspector"),
      summary: campo("summary"),
      findings: campo("findings"),
      ...(photo ? { photo } : {}),
      ...(geo ? { geo } : {}),
    };

    const problemas = validarPayload(payload);
    setErrores(problemas);
    if (problemas.length > 0) {
      setMensaje("");
      return;
    }

    try {
      agregar(payload);
    } catch {
      setMensaje("");
      setErrores(["No hay espacio en el dispositivo para guardar. Quita la foto e intenta de nuevo."]);
      return;
    }
    setMensaje(
      online
        ? "Inspección guardada. Enviando al servidor…"
        : "Inspección guardada en este dispositivo. Se enviará cuando vuelva la conexión."
    );
    if (!online) {
      // Recordatorio local; si no hay permiso o soporte, el aviso de arriba ya cubre el caso.
      void mostrarRecordatorio("Inspección guardada sin conexión", "Se enviará cuando vuelva la red.");
    }
    form.reset();
    setPhoto(undefined);
    setGeo(undefined);
    setFecha(fechaLocalHoy());
  }

  const pendientes = items.filter((i) => i.status !== "synced").length;

  return (
    <main className="page-shell">
      <p>
        <Link href="/inspecciones">← Volver al listado</Link>
      </p>
      <h1>Nueva inspección</h1>

      <p className={`sync-banner ${online ? "sync-online" : "sync-offline"}`} role="status">
        {online ? "Con conexión" : "Sin conexión: los registros se guardan en este dispositivo"}
      </p>

      <form onSubmit={guardar} className="form-grid" noValidate>
        <div className="form-field">
          <label htmlFor="location">Laboratorio</label>
          <input id="location" name="location" list="labs" required maxLength={80} autoComplete="off" />
          <datalist id="labs">
            {laboratorios.map((lab) => (
              <option key={lab} value={lab} />
            ))}
          </datalist>
        </div>

        <div className="form-field">
          <label htmlFor="date">Fecha</label>
          <input id="date" name="date" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>

        <div className="form-field">
          <label htmlFor="inspector">Responsable</label>
          <input id="inspector" name="inspector" required maxLength={80} autoComplete="off" />
        </div>

        <div className="form-field">
          <label htmlFor="summary">Resumen (opcional)</label>
          <input id="summary" name="summary" maxLength={300} autoComplete="off" />
        </div>

        <div className="form-field form-wide">
          <label htmlFor="findings">Hallazgos</label>
          <textarea id="findings" name="findings" rows={4} required maxLength={1000} />
        </div>

        <DevicePanel photo={photo} geo={geo} onPhoto={setPhoto} onGeo={setGeo} />

        {errores.length > 0 && (
          <ul role="alert" className="form-errors form-wide">
            {errores.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        {mensaje && (
          <p role="status" className="form-ok form-wide">
            {mensaje}
          </p>
        )}

        <div className="form-wide">
          <button type="submit">Guardar inspección</button>
        </div>
      </form>

      <section aria-labelledby="mis-registros">
        <h2 id="mis-registros">Mis registros ({pendientes} sin sincronizar)</h2>
        <button type="button" onClick={() => void sincronizar()} disabled={!online || syncing}>
          {syncing ? "Sincronizando…" : "Sincronizar ahora"}
        </button>

        {items.length === 0 ? (
          <p className="state-message">Aún no has guardado inspecciones en este dispositivo.</p>
        ) : (
          <ul className="sync-list">
            {items.map((item) => (
              <li key={item.clientId} className="inspection-card">
                <span className={`sync-badge sync-${item.status}`}>{ETIQUETAS_SYNC[item.status]}</span>
                <h3>{item.payload.location}</h3>
                <p className="muted">
                  {item.payload.date} · {item.payload.inspector}
                </p>
                <p>{item.payload.findings}</p>
                {item.payload.photo && <img src={item.payload.photo} alt="Foto de la inspección" className="photo-preview" />}
                {item.payload.geo && (
                  <p className="muted">
                    Ubicación: {item.payload.geo.lat}, {item.payload.geo.lon}
                  </p>
                )}
                {item.status === "error" && item.lastError && <p className="muted">{item.lastError}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
