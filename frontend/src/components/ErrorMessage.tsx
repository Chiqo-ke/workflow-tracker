interface Props {
  message?: string;
}

export default function ErrorMessage({ message = "Something went wrong." }: Props) {
  return (
    <div
      style={{
        background: "var(--color-red-bg)",
        color: "var(--color-red-text)",
        padding: "1rem",
        borderRadius: "var(--radius-md)",
        marginBottom: "1rem",
      }}
    >
      {message}
    </div>
  );
}
