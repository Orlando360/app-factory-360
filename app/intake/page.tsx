import IntakeForm from "@/components/IntakeForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Diagnóstico gratuito — App Factory 360",
  description: "Cuéntanos sobre tu negocio y construiremos tu app personalizada en 24 horas.",
};

export default function IntakePage() {
  return <IntakeForm />;
}
