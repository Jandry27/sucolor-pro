import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://sucolor.vercel.app",
  "http://localhost:5173",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin",
  };
}

// SRI Catastro endpoint — servicio público del SRI Ecuador
const SRI_CATASTRO_URL =
  "https://srienlinea.sri.gob.ec/sri-catastro-sujeto-servicio-internet/rest/ConsolidadoContribuyente/obtenerPorNumerosRuc";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(req) });
  }

  try {
    const { identificacion } = await req.json();

    if (!identificacion || identificacion.length < 10) {
      return new Response(
        JSON.stringify({ success: false, message: "Identificación inválida" }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Convert cédula (10 digits) to RUC format (13 digits) by appending "001"
    let ruc = identificacion.trim();
    if (ruc.length === 10) {
      ruc = ruc + "001";
    }

    console.log(`Consultando SRI catastro para RUC: ${ruc}`);

    const sriResponse = await fetch(`${SRI_CATASTRO_URL}?ruc=${ruc}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (!sriResponse.ok) {
      console.error(`SRI responded with status: ${sriResponse.status}`);
      return new Response(
        JSON.stringify({ success: false, message: `SRI no disponible (${sriResponse.status})` }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 502 }
      );
    }

    const sriData = await sriResponse.json();

    if (!sriData || !Array.isArray(sriData) || sriData.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Contribuyente no encontrado en el SRI" }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 404 }
      );
    }

    const contribuyente = sriData[0];

    // Return structured data
    const result = {
      success: true,
      data: {
        ruc: contribuyente.numeroRuc || "",
        razonSocial: contribuyente.razonSocial || "",
        estado: contribuyente.estadoContribuyenteRuc || "",
        actividadEconomica: contribuyente.actividadEconomicaPrincipal || "",
        tipoContribuyente: contribuyente.tipoContribuyente || "",
        regimen: contribuyente.regimen || "",
        categoria: contribuyente.categoria || "",
        obligadoContabilidad: contribuyente.obligadoLlevarContabilidad === "SI",
        agenteRetencion: contribuyente.agenteRetencion === "SI",
        contribuyenteEspecial: contribuyente.contribuyenteEspecial === "SI",
        contribuyenteFantasma: contribuyente.contribuyenteFantasma === "SI",
        transaccionesInexistente: contribuyente.transaccionesInexistente === "SI",
      },
    };

    console.log(`SRI lookup exitoso: ${contribuyente.razonSocial}`);

    return new Response(JSON.stringify(result), {
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Error en sri-lookup:", error.message);
    return new Response(
      JSON.stringify({ success: false, message: error.message }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" }, status: 500 }
    );
  }
});
