import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load .env.local
const envPath = path.resolve(__dirname, "../.env.local");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Faltan variables SUPABASE_URL o SUPABASE_SERVICE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testClient = {
  business_name: "Pequeños Gigantes",
  sector: "Moda infantil / Retail",
  years_operating: "4 años",
  team_size: "6 personas (3 vendedoras, 1 bodeguera, 1 diseñadora, yo)",
  main_product: "Ropa infantil de 0 a 12 años: bodies, conjuntos, vestidos y accesorios. También línea de maternidad.",
  business_description: "Tienda física en el Centro Comercial Unicentro de Pereira y tienda online en Instagram con envíos a todo Colombia.",
  main_problem: "No sé cuánto inventario tengo en tiempo real. Vendo algo en Instagram y cuando voy a buscarlo ya lo vendieron en la tienda física. Eso me genera devoluciones, clientes bravos y pérdida de ventas. También no sé qué referencias venden más para saber qué pedir.",
  problem_duration: "Desde que abrí la tienda online hace 2 años. Antes solo era física y era manejable.",
  tried_solutions: "Intenté con una hoja de Excel compartida en Google Drive pero nadie la actualiza en tiempo real. También probé con el sistema del proveedor de pagos pero solo registra transacciones, no inventario. Contraté una practicante para manejar el inventario pero se fue.",
  monthly_cost: "Creo que pierdo entre 3 y 5 millones de pesos al mes en ventas que no puedo completar, más clientes que no vuelven. En diciembre perdí como 8 millones por eso.",
  impact_if_solved: "Podría abrir otro local con confianza porque sabría exactamente qué hay en cada punto. Podría hacer campañas de Instagram sabiendo que sí tengo el producto. Y atendería mucho más rápido en la tienda.",
  client_management: "WhatsApp para pedidos online, libreta física en la tienda para clientes frecuentes y sus tallas. No tengo CRM.",
  time_consuming_process: "Hacer el conteo de inventario cada semana. Tarda medio día y siempre encontramos diferencias. También responder en Instagram pregunta por pregunta si hay disponibilidad.",
  has_team: "Sí, las 3 vendedoras necesitan ver el inventario en tiempo real. La diseñadora necesita ver qué referencias funcionan para reordenar. Yo necesito ver todo desde el celular aunque esté fuera.",
  daily_metrics: "Ventas del día (pesos y unidades), qué referencias se vendieron, cuántas unidades quedan de cada referencia, pedidos de Instagram pendientes de despachar.",
  current_software: "Solo WhatsApp Business y Excel. El banco envía extractos pero no los proceso. No tengo POS, cobro en efectivo o Nequi.",
  six_month_goal: "Abrir mi segundo local en el CC Parque Arboleda de Pereira y lanzar una página web propia. Quiero llegar a 40 millones de pesos en ventas mensuales.",
  competitors: "Baby Fresh (cadena nacional), tiendas en el CC Victoria de Pereira, y varios perfiles grandes de ropa infantil en Instagram como @bebitoscolombia.",
  differentiator: "Diseños exclusivos que no se consiguen en cadenas. Atención personalizada: recuerdo las tallas y gustos de cada cliente. Y envío el mismo día en Pereira.",
  willingness_to_pay: "Entre 150.000 y 250.000 pesos al mes si de verdad resuelve el problema del inventario. Si me ahorra lo que pierdo, es una ganga.",
  additional_info: "Soy muy activa en Instagram (@pequenosgigantesco) con 28.000 seguidores. Tengo proveedores en Medellín y también importo de Panamá. La temporada alta es diciembre, amor y amistad, y regreso a clases. Lo más importante para mí es que sea FÁCIL de usar, mis vendedoras no son muy tecnológicas.",
  status: "pending",
  agent_outputs: {},
  github_url: null,
  vercel_url: null,
  error_message: null,
};

async function main() {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  App Factory 360 — Seed Cliente de Prueba");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  console.log(`📦 Insertando cliente: ${testClient.business_name}...`);

  const { data, error } = await supabase
    .from("clients")
    .insert(testClient)
    .select()
    .single();

  if (error) {
    console.error("❌ Error insertando cliente:", error.message);
    process.exit(1);
  }

  console.log(`✓ Cliente creado con ID: ${data.id}`);
  console.log(`✓ Negocio: ${data.business_name}`);
  console.log(`✓ Sector: ${data.sector}`);
  console.log(`✓ Status: ${data.status}`);

  console.log("\n🚀 Disparando pipeline de generación...\n");

  // Trigger generation via API
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId: data.id }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("❌ Error disparando pipeline:", response.status, text);
    process.exit(1);
  }

  const result = await response.json();
  console.log("✓ Pipeline iniciado:", result);
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Monitorea el progreso en:");
  console.log(`  http://localhost:3000/dashboard/${data.id}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

main().catch((e) => {
  console.error("❌ Error fatal:", e);
  process.exit(1);
});
