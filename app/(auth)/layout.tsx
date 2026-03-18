export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'linear-gradient(135deg, #060b18 0%, #0f1f4a 50%, #0d1a3d 100%)' }}
    >
      {children}
    </div>
  )
}
