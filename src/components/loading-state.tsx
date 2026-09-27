type LoadingStateProps = {
  message?: string;
};

export function LoadingState({ message = "Cargando inspecciones…" }: LoadingStateProps) {
  return (
    <section aria-busy="true" role="status" className="state-message">
      {message}
    </section>
  );
}