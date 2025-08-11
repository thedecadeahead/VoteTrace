export default function Spinner({ size = 20 }: { size?: number }) {
  const border = Math.max(2, Math.round(size / 10))
  return (
    <span
      aria-hidden
      className="inline-block animate-spin rounded-full border-gray-300 border-t-blue-600"
      style={{ width: size, height: size, borderWidth: border }}
    />
  )
}


