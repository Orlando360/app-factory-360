import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(245,197,24,0.1)] bg-[rgba(10,10,10,0.8)] backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5C518] flex items-center justify-center">
              <span className="text-[#0A0A0A] font-black text-sm">360</span>
            </div>
            <span className="font-bold text-white text-lg">App Factory 360</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-[rgba(255,255,255,0.6)] hover:text-white transition-colors">
              Cómo funciona
            </a>
            <Link
              href="/intake"
              className="bg-[#F5C518] text-[#0A0A0A] font-bold px-5 py-2.5 text-sm rounded-lg hover:bg-[#e6b515] transition-colors"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden" style={{
        backgroundImage: "linear-gradient(rgba(245,197,24,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,197,24,0.03) 1px, transparent 1px)",
        backgroundSize: "48px 48px"
      }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-3xl pointer-events-none" style={{ background: "rgba(245,197,24,0.04)" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(245,197,24,0.3)] bg-[rgba(245,197,24,0.05)] text-[#F5C518] text-sm font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F5C518] animate-pulse" />
            Powered by Claude AI · Agentes autónomos
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
            Transforma el dolor de tu negocio en una{" "}
            <span style={{
              background: "linear-gradient(135deg, #F5C518 0%, #ffdb6b 50%, #F5C518 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              app personalizada
            </span>{" "}
            en 24 horas
          </h1>

          <p className="text-xl text-[rgba(255,255,255,0.6)] max-w-2xl mx-auto mb-10 leading-relaxed">
            Rellena un formulario de diagnóstico. Nuestros 8 agentes de IA analizan tu negocio,
            diseñan, construyen y despliegan tu app automáticamente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/intake"
              className="bg-[#F5C518] text-[#0A0A0A] font-bold px-8 py-4 text-base rounded-xl hover:bg-[#e6b515] transition-all duration-200 w-full sm:w-auto text-center"
            >
              Solicitar mi app gratis →
            </Link>
            <a
              href="#how-it-works"
              className="border border-[rgba(245,197,24,0.3)] text-white font-semibold px-8 py-4 text-base rounded-xl hover:border-[rgba(245,197,24,0.7)] hover:bg-[rgba(245,197,24,0.05)] transition-all duration-200 w-full sm:w-auto text-center"
            >
              Ver cómo funciona
            </a>
          </div>

          <p className="mt-8 text-sm text-[rgba(255,255,255,0.35)]">
            Sin tarjeta de crédito · Diagnóstico gratuito · Entrega en 24h
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-6 border-y border-[rgba(245,197,24,0.1)]">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: "8", label: "Agentes de IA", sub: "trabajando en paralelo" },
            { value: "24h", label: "Tiempo de entrega", sub: "desde diagnóstico a app viva" },
            { value: "100%", label: "Personalizado", sub: "para tu negocio específico" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-4xl font-black text-[#F5C518] mb-1">{stat.value}</div>
              <div className="font-semibold text-white text-sm mb-0.5">{stat.label}</div>
              <div className="text-xs text-[rgba(255,255,255,0.4)]">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Así funciona</h2>
            <p className="text-[rgba(255,255,255,0.5)] text-lg max-w-xl mx-auto">
              Tres pasos simples. El resto lo hacen los agentes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: "Rellena el diagnóstico",
                description:
                  "20 preguntas sobre tu negocio, tu dolor principal y tu visión. Tarda 10 minutos. Es todo lo que necesitamos.",
                icon: "📋",
              },
              {
                step: "02",
                title: "La IA analiza y construye",
                description:
                  "8 agentes especializados: diagnóstico, arquitectura, diseño UI/UX, construcción, QA, deploy, monetización y growth.",
                icon: "⚡",
              },
              {
                step: "03",
                title: "Recibes tu app en vivo",
                description:
                  "En 24 horas recibes un link a tu app desplegada en producción con GitHub repo y panel de admin incluido.",
                icon: "🚀",
              },
            ].map((step) => (
              <div
                key={step.step}
                className="relative overflow-hidden p-8 rounded-xl border border-[rgba(245,197,24,0.2)] bg-[rgba(255,255,255,0.03)] backdrop-blur-sm hover:border-[rgba(245,197,24,0.4)] transition-all duration-300"
              >
                <div className="absolute top-4 right-4 text-6xl font-black select-none" style={{ color: "rgba(245,197,24,0.08)" }}>
                  {step.step}
                </div>
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-[rgba(255,255,255,0.55)] leading-relaxed text-sm">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agents section */}
      <section className="py-24 px-6 bg-[rgba(245,197,24,0.02)]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">8 agentes expertos trabajando por ti</h2>
            <p className="text-[rgba(255,255,255,0.5)] text-lg max-w-2xl mx-auto">
              Cada agente es un especialista entrenado en su área. Juntos construyen tu solución end-to-end.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: "01", name: "Diagnóstico", role: "Consultor McKinsey + JTBD" },
              { n: "02", name: "Arquitecto", role: "Product Architect YC/SaaS" },
              { n: "03", name: "UI/UX", role: "Senior Design Engineer" },
              { n: "04", name: "Builder", role: "Full Stack Engineer" },
              { n: "05", name: "QA", role: "Quality Assurance Engineer" },
              { n: "06", name: "Deploy", role: "DevOps & Infrastructure" },
              { n: "07", name: "Monetización", role: "Revenue Strategy LATAM" },
              { n: "08", name: "Growth", role: "B2B Growth Engineer" },
            ].map((agent) => (
              <div
                key={agent.n}
                className="p-5 rounded-xl border border-[rgba(245,197,24,0.2)] bg-[rgba(255,255,255,0.03)] backdrop-blur-sm hover:border-[rgba(245,197,24,0.3)] transition-all duration-200"
              >
                <div className="text-[#F5C518] text-xs font-bold mb-2 opacity-60">{agent.n}</div>
                <div className="font-bold text-sm mb-1">{agent.name}</div>
                <div className="text-[rgba(255,255,255,0.45)] text-xs">{agent.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">¿Tu negocio tiene alguno de estos problemas?</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-12">
            {[
              "Gestionas clientes por WhatsApp o Excel",
              "No tienes visibilidad de métricas en tiempo real",
              "Tu equipo trabaja con procesos manuales",
              "Pierdes tiempo en tareas repetitivas",
              "No puedes escalar porque todo depende de ti",
              "Tus competidores ya tienen herramientas y tú no",
            ].map((pain) => (
              <div key={pain} className="flex items-start gap-3 p-4 rounded-xl border border-[rgba(245,197,24,0.2)] bg-[rgba(255,255,255,0.03)]">
                <span className="text-[#F5C518] mt-0.5 flex-shrink-0">✓</span>
                <span className="text-[rgba(255,255,255,0.7)] text-sm">{pain}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-[rgba(255,255,255,0.5)] mb-6 text-lg">
              Si marcaste alguno, tenemos la solución.
            </p>
            <Link
              href="/intake"
              className="bg-[#F5C518] text-[#0A0A0A] font-bold px-10 py-4 text-base rounded-xl hover:bg-[#e6b515] transition-colors inline-block"
            >
              Quiero mi app personalizada →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 border-t border-[rgba(245,197,24,0.1)]">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-xl border border-[rgba(245,197,24,0.2)] bg-[rgba(255,255,255,0.03)] backdrop-blur-sm">
            <h2 className="text-4xl font-black mb-4">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-[rgba(255,255,255,0.55)] text-lg mb-8 max-w-lg mx-auto">
              El diagnóstico es gratuito. En 10 minutos sabremos exactamente qué necesitas.
            </p>
            <Link
              href="/intake"
              className="bg-[#F5C518] text-[#0A0A0A] font-bold px-10 py-4 text-lg rounded-xl hover:bg-[#e6b515] transition-colors inline-block"
            >
              Comenzar diagnóstico gratuito
            </Link>
            <p className="mt-4 text-sm text-[rgba(255,255,255,0.3)]">
              Sin compromisos · Respuesta en 24 horas
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[rgba(255,255,255,0.06)]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#F5C518] flex items-center justify-center">
              <span className="text-[#0A0A0A] font-black text-xs">360</span>
            </div>
            <span className="text-sm text-[rgba(255,255,255,0.5)]">App Factory 360 by Orlando 360</span>
          </div>
          <p className="text-xs text-[rgba(255,255,255,0.3)]">
            © {new Date().getFullYear()} Orlando 360. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
