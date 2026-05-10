import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/clienteSupabase-js@2.39.0';
import forge from 'npm:node-forge@1.3.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// SRI ENDPOINTS
// ============================================================
const SRI_URLS = {
    1: {
        recepcion:
            'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
        autorizacion:
            'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
    },
    2: {
        recepcion:
            'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline',
        autorizacion:
            'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline',
    },
};

// ============================================================
// MÓDULO 11 — Dígito verificador para Clave de Acceso
// ============================================================
function modulo11(numero: string): string {
    const digits = numero.split('').map(Number).reverse();
    let sum = 0;
    let factor = 2;
    for (const d of digits) {
        sum += d * factor;
        factor = factor === 7 ? 2 : factor + 1;
    }
    const remainder = sum % 11;
    const result = 11 - remainder;
    if (result === 11) return '0';
    if (result === 10) return '1';
    return String(result);
}

function generateClaveAcceso(
    fechaEmision: string, // dd/mm/yyyy
    tipoComprobante: string,
    ruc: string,
    ambiente: string,
    establecimiento: string,
    puntoEmision: string,
    secuencial: string,
    codigoNumerico: string,
    tipoEmision: string
): string {
    const [dd, mm, yyyy] = fechaEmision.split('/');
    const base =
        dd +
        mm +
        yyyy +
        tipoComprobante +
        ruc +
        ambiente +
        establecimiento +
        puntoEmision +
        secuencial +
        codigoNumerico +
        tipoEmision;
    if (base.length !== 48)
        throw new Error(`Clave acceso base debe tener 48 dígitos, tiene ${base.length}`);
    return base + modulo11(base);
}

// ============================================================
// GENERAR XML DE FACTURA (SRI v2.1.0)
// ============================================================
function buildFacturaXml(data: {
    claveAcceso: string;
    ambiente: string;
    tipoEmision: string;
    razonSocial: string;
    nombreComercial: string;
    ruc: string;
    estab: string;
    ptoEmi: string;
    secuencial: string;
    dirMatriz: string;
    contribuyenteRimpe?: string;
    agenteRetencion?: string;
    fechaEmision: string;
    obligadoContabilidad: string;
    tipoIdentificacionComprador: string;
    razonSocialComprador: string;
    identificacionComprador: string;
    direccionComprador: string;
    totalSinImpuestos: string;
    totalDescuento: string;
    totalConImpuestos: Array<{
        codigo: string;
        codigoPorcentaje: string;
        baseImponible: string;
        valor: string;
    }>;
    propina: string;
    importeTotal: string;
    pagos: Array<{
        formaPago: string;
        total: string;
        plazo: string;
        unidadTiempo: string;
    }>;
    detalles: Array<{
        codigoPrincipal: string;
        descripcion: string;
        cantidad: string;
        precioUnitario: string;
        descuento: string;
        precioTotalSinImpuesto: string;
        impuestos: Array<{
            codigo: string;
            codigoPorcentaje: string;
            tarifa: string;
            baseImponible: string;
            valor: string;
        }>;
    }>;
    infoAdicional: Array<{ nombre: string; valor: string }>;
}): string {
    const esc = (s: string) =>
        s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

    let xml = '';
    xml += `<factura id="comprobante" version="2.1.0">`;
    xml += `<infoTributaria>`;
    xml += `<ambiente>${data.ambiente}</ambiente>`;
    xml += `<tipoEmision>${data.tipoEmision}</tipoEmision>`;
    xml += `<razonSocial>${esc(data.razonSocial)}</razonSocial>`;
    xml += `<nombreComercial>${esc(data.nombreComercial)}</nombreComercial>`;
    xml += `<ruc>${data.ruc}</ruc>`;
    xml += `<claveAcceso>${data.claveAcceso}</claveAcceso>`;
    xml += `<codDoc>01</codDoc>`;
    xml += `<estab>${data.estab}</estab>`;
    xml += `<ptoEmi>${data.ptoEmi}</ptoEmi>`;
    xml += `<secuencial>${data.secuencial}</secuencial>`;
    xml += `<dirMatriz>${esc(data.dirMatriz)}</dirMatriz>`;
    if (data.contribuyenteRimpe)
        xml += `<contribuyenteRimpe>${esc(data.contribuyenteRimpe)}</contribuyenteRimpe>`;
    if (data.agenteRetencion)
        xml += `<agenteRetencion>${esc(data.agenteRetencion)}</agenteRetencion>`;
    xml += `</infoTributaria>`;

    xml += `<infoFactura>`;
    xml += `<fechaEmision>${data.fechaEmision}</fechaEmision>`;
    xml += `<dirEstablecimiento>${esc(data.dirMatriz)}</dirEstablecimiento>`;
    xml += `<obligadoContabilidad>${data.obligadoContabilidad}</obligadoContabilidad>`;
    xml += `<tipoIdentificacionComprador>${data.tipoIdentificacionComprador}</tipoIdentificacionComprador>`;
    xml += `<razonSocialComprador>${esc(data.razonSocialComprador)}</razonSocialComprador>`;
    xml += `<identificacionComprador>${data.identificacionComprador}</identificacionComprador>`;
    xml += `<direccionComprador>${esc(data.direccionComprador)}</direccionComprador>`;
    xml += `<totalSinImpuestos>${data.totalSinImpuestos}</totalSinImpuestos>`;
    xml += `<totalDescuento>${data.totalDescuento}</totalDescuento>`;
    xml += `<totalConImpuestos>`;
    for (const imp of data.totalConImpuestos) {
        xml += `<totalImpuesto>`;
        xml += `<codigo>${imp.codigo}</codigo>`;
        xml += `<codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>`;
        xml += `<baseImponible>${imp.baseImponible}</baseImponible>`;
        xml += `<valor>${imp.valor}</valor>`;
        xml += `</totalImpuesto>`;
    }
    xml += `</totalConImpuestos>`;
    xml += `<propina>${data.propina}</propina>`;
    xml += `<importeTotal>${data.importeTotal}</importeTotal>`;
    xml += `<moneda>DOLAR</moneda>`;
    xml += `<pagos>`;
    for (const p of data.pagos) {
        xml += `<pago>`;
        xml += `<formaPago>${p.formaPago}</formaPago>`;
        xml += `<total>${p.total}</total>`;
        xml += `<plazo>${p.plazo}</plazo>`;
        xml += `<unidadTiempo>${p.unidadTiempo}</unidadTiempo>`;
        xml += `</pago>`;
    }
    xml += `</pagos>`;
    xml += `</infoFactura>`;

    xml += `<detalles>`;
    for (const det of data.detalles) {
        xml += `<detalle>`;
        xml += `<codigoPrincipal>${esc(det.codigoPrincipal)}</codigoPrincipal>`;
        xml += `<descripcion>${esc(det.descripcion)}</descripcion>`;
        xml += `<cantidad>${det.cantidad}</cantidad>`;
        xml += `<precioUnitario>${det.precioUnitario}</precioUnitario>`;
        xml += `<descuento>${det.descuento}</descuento>`;
        xml += `<precioTotalSinImpuesto>${det.precioTotalSinImpuesto}</precioTotalSinImpuesto>`;
        xml += `<impuestos>`;
        for (const i of det.impuestos) {
            xml += `<impuesto>`;
            xml += `<codigo>${i.codigo}</codigo>`;
            xml += `<codigoPorcentaje>${i.codigoPorcentaje}</codigoPorcentaje>`;
            xml += `<tarifa>${i.tarifa}</tarifa>`;
            xml += `<baseImponible>${i.baseImponible}</baseImponible>`;
            xml += `<valor>${i.valor}</valor>`;
            xml += `</impuesto>`;
        }
        xml += `</impuestos>`;
        xml += `</detalle>`;
    }
    xml += `</detalles>`;

    if (data.infoAdicional.length > 0) {
        xml += `<infoAdicional>`;
        for (const ia of data.infoAdicional) {
            xml += `<campoAdicional nombre="${esc(ia.nombre)}">${esc(ia.valor)}</campoAdicional>`;
        }
        xml += `</infoAdicional>`;
    }

    xml += `</factura>`;
    return xml;
}

// ============================================================
// XAdES-BES SIGNING con node-forge (SHA-256)
// ============================================================
function sha1Bytes(input: string): string {
    const md = forge.md.sha1.create();
    md.update(input, 'utf8');
    return md.digest().getBytes();
}

function sha1Base64(input: string): string {
    return forge.util.encode64(sha1Bytes(input));
}

function sha256Bytes(input: string): string {
    const md = forge.md.sha256.create();
    md.update(input, 'utf8');
    return md.digest().getBytes();
}

function sha256Base64(input: string): string {
    return forge.util.encode64(sha256Bytes(input));
}

function sha256BytesRaw(input: string): string {
    const md = forge.md.sha256.create();
    md.update(input, 'raw');
    return md.digest().getBytes();
}

function signXmlWithP12(
    xmlCompacto: string,
    p12ArrayBuffer: ArrayBuffer,
    p12Password: string
): string {
    // --- Parse P12 ---
    const p12Bytes = new Uint8Array(p12ArrayBuffer);
    let binaryStr = '';
    for (let i = 0; i < p12Bytes.length; i++) {
        binaryStr += String.fromCharCode(p12Bytes[i]);
    }
    const p12Asn1 = forge.asn1.fromDer(binaryStr);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, p12Password);

    // Extract private key
    const keyBags = p12.getBags({
        bagType: forge.pki.oids.pkcs8ShroudedKeyBag,
    });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    if (!keyBag || keyBag.length === 0)
        throw new Error('No se encontró clave privada en el archivo .p12');
    const privateKey = keyBag[0].key;
    if (!privateKey) throw new Error('Clave privada inválida en .p12');

    // Extract ALL certificates from .p12
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    if (!certBag || certBag.length === 0)
        throw new Error('No se encontró certificado en el archivo .p12');

    console.log(`Found ${certBag.length} certificate(s) in .p12 file`);

    // Find the signing certificate (the one whose public key matches the private key)
    let cert = null;
    const allCerts: any[] = [];
    const privKeyModulus = (privateKey as any).n.toString(16);
    for (const bag of certBag) {
        if (bag.cert) {
            allCerts.push(bag.cert);
            const cn = bag.cert.subject.getField('CN')?.value || 'unknown';
            const validTo = bag.cert.validity.notAfter;
            console.log(`  Certificate: ${cn}, Valid until: ${validTo.toISOString()}`);

            const pubKeyModulus = (bag.cert.publicKey as any).n?.toString(16);
            if (pubKeyModulus && pubKeyModulus === privKeyModulus) {
                cert = bag.cert;
                console.log(`  >> This is the SIGNING certificate`);
            }
        }
    }
    // Fallback: if no match found, try the last certificate (often the signing one)
    if (!cert) {
        cert = certBag[certBag.length - 1].cert || certBag[0].cert;
        console.log('Using fallback certificate (no modulus match found)');
    }
    if (!cert) throw new Error('Certificado inválido en .p12');

    // --- Check certificate validity ---
    const now = new Date();
    if (cert.validity.notAfter < now) {
        throw new Error(
            `El certificado de firma electrónica EXPIRÓ el ${cert.validity.notAfter.toISOString()}. Debes renovar tu firma .p12.`
        );
    }
    if (cert.validity.notBefore > now) {
        throw new Error(
            `El certificado de firma electrónica aún no es válido (válido desde ${cert.validity.notBefore.toISOString()}).`
        );
    }
    console.log('Certificate is valid, expires:', cert.validity.notAfter.toISOString());

    // --- Certificate info ---
    const certDer = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
    const certBase64 = forge.util.encode64(certDer);
    const certDigest = forge.util.encode64(sha256BytesRaw(certDer));

    // Build X509Certificate entries for ALL certs in chain (signing cert first)
    let x509CertificatesXml = `<ds:X509Certificate>${certBase64}</ds:X509Certificate>`;
    for (const c of allCerts) {
        if (c !== cert) {
            const cDer = forge.asn1.toDer(forge.pki.certificateToAsn1(c)).getBytes();
            const cBase64 = forge.util.encode64(cDer);
            x509CertificatesXml += `<ds:X509Certificate>${cBase64}</ds:X509Certificate>`;
        }
    }

    // Issuer DN
    const issuerParts = cert.issuer.attributes
        .map((a: any) => {
            const name = a.shortName || a.name || a.type;
            return `${name}=${a.value}`;
        })
        .reverse();
    const issuerDN = issuerParts.join(',');

    // Serial number (hex → decimal)
    const serialHex = cert.serialNumber;
    const serialDecimal = BigInt('0x' + serialHex).toString();

    // RSA modulus + exponent
    const modHex = (privateKey as any).n.toString(16);
    const modBytes = forge.util.hexToBytes(modHex.length % 2 ? '0' + modHex : modHex);
    const modulusB64 = forge.util.encode64(modBytes);

    const expHex = (privateKey as any).e.toString(16);
    const expBytes = forge.util.hexToBytes(expHex.length % 2 ? '0' + expHex : expHex);
    const exponentB64 = forge.util.encode64(expBytes);

    // --- Unique IDs ---
    const ts = Date.now();
    const sigId = `Signature${ts}`;
    const signedInfoId = `SignedInfo-${sigId}`;
    const signedPropsId = `SignedProperties-${sigId}`;
    const certId = `Certificate${ts}`;
    const refId = `Reference-${ts}`;
    const sigValueId = `SignatureValue-${ts}`;

    // --- Signing time (Ecuador UTC-5) ---
    const ecOffset = -5 * 60;
    const ecTime = new Date(now.getTime() + (ecOffset + now.getTimezoneOffset()) * 60000);
    const pad2 = (n: number) => String(n).padStart(2, '0');
    const signingTime = `${ecTime.getFullYear()}-${pad2(ecTime.getMonth() + 1)}-${pad2(ecTime.getDate())}T${pad2(ecTime.getHours())}:${pad2(ecTime.getMinutes())}:${pad2(ecTime.getSeconds())}-05:00`;

    // ---- STEP 1: Digest of document (SHA-256) ----
    const docDigest = sha256Base64(xmlCompacto);

    // ---- STEP 2: Build SignedProperties (with namespace declarations for C14N) ----
    const signedProperties =
        `<etsi:SignedProperties xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signedPropsId}">` +
        `<etsi:SignedSignatureProperties>` +
        `<etsi:SigningTime>${signingTime}</etsi:SigningTime>` +
        `<etsi:SigningCertificate>` +
        `<etsi:Cert>` +
        `<etsi:CertDigest>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>` +
        `<ds:DigestValue>${certDigest}</ds:DigestValue>` +
        `</etsi:CertDigest>` +
        `<etsi:IssuerSerial>` +
        `<ds:X509IssuerName>${issuerDN}</ds:X509IssuerName>` +
        `<ds:X509SerialNumber>${serialDecimal}</ds:X509SerialNumber>` +
        `</etsi:IssuerSerial>` +
        `</etsi:Cert>` +
        `</etsi:SigningCertificate>` +
        `</etsi:SignedSignatureProperties>` +
        `<etsi:SignedDataObjectProperties>` +
        `<etsi:DataObjectFormat ObjectReference="#${refId}">` +
        `<etsi:Description>contenido comprobante</etsi:Description>` +
        `<etsi:MimeType>text/xml</etsi:MimeType>` +
        `</etsi:DataObjectFormat>` +
        `</etsi:SignedDataObjectProperties>` +
        `</etsi:SignedProperties>`;

    const spDigest = sha256Base64(signedProperties);

    // ---- STEP 3: Build SignedInfo (SHA-256 digests + RSA-SHA256 signature) ----
    const signedInfo =
        `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${signedInfoId}">` +
        `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"></ds:CanonicalizationMethod>` +
        `<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"></ds:SignatureMethod>` +
        `<ds:Reference Id="${refId}" Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropsId}">` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>` +
        `<ds:DigestValue>${spDigest}</ds:DigestValue>` +
        `</ds:Reference>` +
        `<ds:Reference URI="#comprobante">` +
        `<ds:Transforms>` +
        `<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></ds:Transform>` +
        `</ds:Transforms>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"></ds:DigestMethod>` +
        `<ds:DigestValue>${docDigest}</ds:DigestValue>` +
        `</ds:Reference>` +
        `</ds:SignedInfo>`;

    // ---- STEP 4: RSA-SHA256 sign the SignedInfo ----
    const siMd = forge.md.sha256.create();
    siMd.update(signedInfo, 'utf8');
    const signatureBytes = privateKey.sign(siMd);
    const signatureValueB64 = forge.util.encode64(signatureBytes);

    // ---- STEP 5: Remove xmlns from SignedInfo/SignedProperties for embedding ----
    const embeddedSignedInfo = signedInfo.replace(
        ` xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"`,
        ''
    );
    const embeddedSignedProps = signedProperties.replace(
        ` xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#"`,
        ''
    );

    // ---- STEP 6: Build complete <ds:Signature> with full cert chain ----
    const signatureXml =
        `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:etsi="http://uri.etsi.org/01903/v1.3.2#" Id="${sigId}">` +
        embeddedSignedInfo +
        `<ds:SignatureValue Id="${sigValueId}">` +
        signatureValueB64 +
        `</ds:SignatureValue>` +
        `<ds:KeyInfo Id="${certId}">` +
        `<ds:X509Data>` +
        x509CertificatesXml +
        `</ds:X509Data>` +
        `<ds:KeyValue>` +
        `<ds:RSAKeyValue>` +
        `<ds:Modulus>${modulusB64}</ds:Modulus>` +
        `<ds:Exponent>${exponentB64}</ds:Exponent>` +
        `</ds:RSAKeyValue>` +
        `</ds:KeyValue>` +
        `</ds:KeyInfo>` +
        `<ds:Object Id="${sigId}-Object">` +
        `<etsi:QualifyingProperties Target="#${sigId}">` +
        embeddedSignedProps +
        `</etsi:QualifyingProperties>` +
        `</ds:Object>` +
        `</ds:Signature>`;

    // ---- STEP 7: Insert signature before </factura> ----
    return xmlCompacto.replace('</factura>', signatureXml + '</factura>');
}

// ============================================================
// SOAP — Enviar a SRI Recepción
// ============================================================
async function sendRecepcion(
    signedXml: string,
    ambiente: number
): Promise<{ estado: string; mensajes: any[] }> {
    const url = SRI_URLS[ambiente as 1 | 2].recepcion;

    // Encode signed XML to base64
    const encoder = new TextEncoder();
    const xmlBytes = encoder.encode(signedXml);
    let binaryStr = '';
    for (let i = 0; i < xmlBytes.length; i++) {
        binaryStr += String.fromCharCode(xmlBytes[i]);
    }
    const xmlBase64 = btoa(binaryStr);

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion"><soapenv:Header/><soapenv:Body><ec:validarComprobante><xml>${xmlBase64}</xml></ec:validarComprobante></soapenv:Body></soapenv:Envelope>`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: '',
        },
        body: soapEnvelope,
    });

    const responseText = await res.text();
    console.log('SRI Recepción FULL response:', responseText);

    // Parse response
    const estadoMatch = responseText.match(/<estado>([^<]+)<\/estado>/);
    const estado = estadoMatch ? estadoMatch[1] : 'ERROR';

    const mensajes: any[] = [];
    const msgRegex =
        /<mensaje>\s*<identificador>([^<]*)<\/identificador>\s*<mensaje>([^<]*)<\/mensaje>(?:\s*<informacionAdicional>([^<]*)<\/informacionAdicional>)?\s*<tipo>([^<]*)<\/tipo>\s*<\/mensaje>/g;
    let m;
    while ((m = msgRegex.exec(responseText)) !== null) {
        mensajes.push({
            identificador: m[1],
            mensaje: m[2],
            informacionAdicional: m[3] || null,
            tipo: m[4],
        });
    }

    return { estado, mensajes };
}

// ============================================================
// SOAP — Consultar Autorización SRI
// ============================================================
async function sendAutorizacion(
    claveAcceso: string,
    ambiente: number
): Promise<{ estado: string; fechaAutorizacion: string | null; mensajes: any[] }> {
    const url = SRI_URLS[ambiente as 1 | 2].autorizacion;

    const soapEnvelope = `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion"><soapenv:Header/><soapenv:Body><ec:autorizacionComprobante><claveAccesoComprobante>${claveAcceso}</claveAccesoComprobante></ec:autorizacionComprobante></soapenv:Body></soapenv:Envelope>`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            SOAPAction: '',
        },
        body: soapEnvelope,
    });

    const responseText = await res.text();
    console.log('SRI Autorización FULL response:', responseText);

    const estadoMatch = responseText.match(/<estado>([^<]+)<\/estado>/);
    const estado = estadoMatch ? estadoMatch[1] : 'PENDIENTE';

    const fechaMatch = responseText.match(/<fechaAutorizacion>([^<]+)<\/fechaAutorizacion>/);

    const mensajes: any[] = [];
    const msgRegex =
        /<mensaje>\s*<identificador>([^<]*)<\/identificador>\s*<mensaje>([^<]*)<\/mensaje>(?:\s*<informacionAdicional>([^<]*)<\/informacionAdicional>)?\s*<tipo>([^<]*)<\/tipo>\s*<\/mensaje>/g;
    let m;
    while ((m = msgRegex.exec(responseText)) !== null) {
        mensajes.push({
            identificador: m[1],
            mensaje: m[2],
            informacionAdicional: m[3] || null,
            tipo: m[4],
        });
    }

    return {
        estado,
        fechaAutorizacion: fechaMatch ? fechaMatch[1] : null,
        mensajes,
    };
}

// ============================================================
// EMAIL — Enviar factura al cliente via Gmail SMTP
// (Formato SRI oficial — mismo diseño que el RIDE descargable)
// ============================================================
async function sendInvoiceEmail(data: {
  to: string;
  empresa: { razon_social: string; ruc: string; direccion: string; nombre_comercial?: string; obligado_contabilidad?: boolean; rimpe?: boolean; contribuyente_especial?: string };
  comprador: { nombre: string; identificacion: string; direccion: string; email: string; telefono?: string };
  factura: {
    secuencial: string;
    claveAcceso: string;
    fechaEmision: string;
    fechaAutorizacion: string;
    items: Array<{ codigo: string; descripcion: string; cantidad: string; precioUnitario: string; subtotal: string; descuento: string }>;
    subtotal0: string;
    subtotal15: string;
    subtotalSinImpuestos: string;
    totalDescuento: string;
    totalIva: string;
    importeTotal: string;
    formaPago: string;
    formaPagoDescripcion: string;
  };
  vehiculo?: { placa?: string; marca?: string; modelo?: string };
  notas?: string;
}): Promise<{ success: boolean; error?: string }> {
    const gmailUser = Deno.env.get('GMAIL_USER');
    const gmailPass = Deno.env.get('GMAIL_APP_PASSWORD');
    if (!gmailUser || !gmailPass) {
        console.log('Gmail credentials not configured, skipping email');
        return { success: false, error: 'Gmail credentials not configured' };
    }

    const esc = (s: string | undefined | null) =>
        (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    const itemsRows = data.factura.items
        .map(
            item => `
    <tr>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc;text-align:center">${esc(item.codigo)}</td>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc;text-align:center">${item.cantidad}</td>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc">${esc(item.descripcion)}</td>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc"></td>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc;text-align:right;font-family:'Courier New',monospace">${item.precioUnitario}</td>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc;text-align:right;font-family:'Courier New',monospace">0.00</td>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc;text-align:right;font-family:'Courier New',monospace">${item.descuento || '0.00'}</td>
      <td style="padding:5px 6px;font-size:10px;border:1px solid #ccc;text-align:right;font-family:'Courier New',monospace">${item.subtotal}</td>
    </tr>`
        )
        .join('');

    const infoAdicionalRows: string[] = [];
    if (data.comprador.telefono)
        infoAdicionalRows.push(
            `<tr><td style="font-weight:bold;padding:2px 4px;font-size:10px;white-space:nowrap">Teléfono:</td><td style="padding:2px 4px;font-size:10px">${esc(data.comprador.telefono)}</td></tr>`
        );
    if (data.comprador.email)
        infoAdicionalRows.push(
            `<tr><td style="font-weight:bold;padding:2px 4px;font-size:10px;white-space:nowrap">Email:</td><td style="padding:2px 4px;font-size:10px">${esc(data.comprador.email)}</td></tr>`
        );
    if (data.vehiculo?.placa) {
        const vInfo = [data.vehiculo.marca, data.vehiculo.modelo].filter(Boolean).join(' ');
        infoAdicionalRows.push(
            `<tr><td style="font-weight:bold;padding:2px 4px;font-size:10px;white-space:nowrap">Vehículo:</td><td style="padding:2px 4px;font-size:10px">Placa ${data.vehiculo.placa}${vInfo ? ` - ${vInfo}` : ''}</td></tr>`
        );
    }
    if (data.notas)
        infoAdicionalRows.push(
            `<tr><td style="font-weight:bold;padding:2px 4px;font-size:10px;white-space:nowrap">Observación:</td><td style="padding:2px 4px;font-size:10px">${esc(data.notas)}</td></tr>`
        );

    const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Factura ${data.factura.secuencial}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;background:#fff;padding:10px;margin:0">
<div style="max-width:680px;margin:0 auto">

  <!-- HEADER COMPACTO -->
  <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #000;border-collapse:collapse;margin-bottom:0">
    <tr>
      <td style="padding:6px 10px;border-right:1.5px solid #000;vertical-align:middle;width:45%;text-align:center">
        <div style="font-size:16px;font-weight:900;color:#ea580c;font-family:Arial,sans-serif;margin-bottom:2px">SuColor</div>
        <div style="font-size:9px;font-weight:bold;text-transform:uppercase;margin-bottom:2px">${esc(data.empresa.razon_social)}</div>
        <div style="font-size:8px;margin-bottom:1px">RUC: ${esc(data.empresa.ruc)}</div>
        <div style="font-size:8px;margin-bottom:1px"><b>Dir:</b> ${esc(data.empresa.direccion)}</div>
      </td>
      <td style="padding:6px 10px;vertical-align:top;width:55%">
        <div style="font-size:12px;font-weight:bold;margin-bottom:2px">FACTURA No. ${esc(data.factura.secuencial)}</div>
        <div style="font-size:8px;margin-bottom:2px"><b>Autorización:</b> ${esc(data.factura.fechaAutorizacion)}</div>
        <div style="font-size:8px;margin-bottom:2px;font-family:'Courier New',monospace;word-break:break-all">Clave: ${esc(data.factura.claveAcceso)}</div>
      </td>
    </tr>
  </table>

  <!-- DATOS COMPRADOR -->
  <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #000;border-top:0;border-collapse:collapse">
    <tr>
      <td style="padding:4px 8px">
        <table cellpadding="0" cellspacing="0" style="width:100%;font-size:8px">
          <tr>
            <td style="padding:1px 0"><b>Cliente:</b> ${esc(data.comprador.nombre)} | <b>ID:</b> ${esc(data.comprador.identificacion)}</td>
          </tr>
          <tr>
            <td style="padding:1px 0"><b>Fecha:</b> ${esc(data.factura.fechaEmision)} | <b>Dirección:</b> ${esc(data.comprador.direccion)}</td>
          </tr>
          ${data.vehiculo?.placa ? `<tr><td style="padding:1px 0"><b>Placa:</b> ${esc(data.vehiculo.placa)}</td></tr>` : ''}
        </table>
      </td>
    </tr>
  </table>

  <!-- ITEMS TABLE COMPACTA -->
  <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #000;border-top:0;border-collapse:collapse">
    <tr>
      <td style="padding:0">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:8px">
          <thead>
            <tr style="background:#f0f0f0">
              <th style="padding:2px 4px;font-weight:bold;border:1px solid #ccc;width:50px">Código</th>
              <th style="padding:2px 4px;font-weight:bold;border:1px solid #ccc;width:35px">Cant</th>
              <th style="padding:2px 4px;font-weight:bold;border:1px solid #ccc">Descripción</th>
              <th style="padding:2px 4px;font-weight:bold;border:1px solid #ccc;width:50px">Precio</th>
              <th style="padding:2px 4px;font-weight:bold;border:1px solid #ccc;width:55px">Total</th>
            </tr>
          </thead>
          <tbody>
            ${data.factura.items
              .map(
                item => `
            <tr>
              <td style="padding:2px 4px;border:1px solid #ccc;text-align:center">${esc(item.codigo)}</td>
              <td style="padding:2px 4px;border:1px solid #ccc;text-align:center">${item.cantidad}</td>
              <td style="padding:2px 4px;border:1px solid #ccc">${esc(item.descripcion || 'Servicio')}</td>
              <td style="padding:2px 4px;border:1px solid #ccc;text-align:right;font-family:'Courier New',monospace">${item.precioUnitario}</td>
              <td style="padding:2px 4px;border:1px solid #ccc;text-align:right;font-family:'Courier New',monospace">${item.subtotal}</td>
            </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </td>
    </tr>
  </table>

  <!-- RESUMEN: Info Adicional + Totales -->
  <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #000;border-top:0;border-collapse:collapse">
    <tr>
      <td style="border-right:1.5px solid #000;padding:4px 8px;vertical-align:top;width:55%;font-size:8px">
        <div style="font-weight:bold;background:#f0f0f0;border:1px solid #ccc;padding:2px;margin-bottom:2px;text-align:center">Información Adicional</div>
        <table cellpadding="0" cellspacing="0" style="width:100%;font-size:8px">
          ${infoAdicionalRows.map(row => `<tr>${row.split('<tr>').pop()}`).join('')}
        </table>
        <div style="font-weight:bold;background:#f0f0f0;border:1px solid #ccc;padding:2px;margin:4px 0 2px 0;text-align:center">Forma de Pago</div>
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:8px">
          <tr><td style="border:1px solid #ccc;padding:2px">${esc(data.factura.formaPagoDescripcion)}</td><td style="border:1px solid #ccc;padding:2px;text-align:right;font-family:'Courier New',monospace">${data.factura.importeTotal}</td></tr>
        </table>
      </td>
      <td style="padding:2px 6px;vertical-align:top;width:45%;font-size:8px">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
          <tr><td style="padding:1px 4px;font-weight:bold;border-bottom:1px solid #eee">SUBTOTAL 0%</td><td style="padding:1px 4px;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #eee">${data.factura.subtotal0}</td></tr>
          <tr><td style="padding:1px 4px;font-weight:bold;border-bottom:1px solid #eee">SUBTOTAL 15%</td><td style="padding:1px 4px;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #eee">${data.factura.subtotal15}</td></tr>
          <tr><td style="padding:1px 4px;font-weight:bold;border-bottom:1px solid #eee">SUBTOTAL</td><td style="padding:1px 4px;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #eee;font-weight:900">${data.factura.subtotalSinImpuestos}</td></tr>
          <tr><td style="padding:1px 4px;font-weight:bold;border-bottom:1px solid #eee">IVA 15%</td><td style="padding:1px 4px;text-align:right;font-family:'Courier New',monospace;border-bottom:1px solid #eee">${data.factura.totalIva}</td></tr>
          <tr><td style="padding:1px 4px;font-weight:bold;border-top:2px solid #000;border-bottom:2px solid #000">TOTAL</td><td style="padding:1px 4px;text-align:right;font-family:'Courier New',monospace;font-weight:bold;border-top:2px solid #000;border-bottom:2px solid #000">${data.factura.importeTotal}</td></tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- PIE Y BOTÓN PDF -->
  <div style="text-align:center;font-size:8px;color:#666;margin-top:8px;padding:8px;border:1px solid #ddd;background:#f9f9f9;border-radius:4px">
    <div style="margin-bottom:6px">Documento generado electrónicamente por ${esc(data.empresa.nombre_comercial || data.empresa.razon_social)}</div>
    <div style="font-size:9px;font-weight:bold;color:#ea580c;margin-top:4px">
      Para descargar esta factura en PDF, ingresa a tu panel de SuColor<br>
      o solicita el RIDE al correo del proveedor.
    </div>
  </div>

</div>
</body>
</html>`;

    try {
        // Use denomailer for Gmail SMTP
        const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');

        const client = new SMTPClient({
            connection: {
                hostname: 'smtp.gmail.com',
                port: 465,
                tls: true,
                auth: {
                    username: gmailUser,
                    password: gmailPass,
                },
            },
        });

        const empresaNombre = data.empresa.nombre_comercial || data.empresa.razon_social;

        await client.send({
            from: `${empresaNombre} <${gmailUser}>`,
            to: data.to,
            subject: `Factura ${data.factura.secuencial} - ${empresaNombre}`,
            content: 'Tu factura electrónica ha sido autorizada por el SRI.',
            html: htmlBody,
        });

        await client.close();
        console.log('Email enviado exitosamente via Gmail a:', data.to);
        return { success: true };
    } catch (err: any) {
        console.error('Error enviando email via Gmail:', err.message);
        return { success: false, error: err.message };
    }
}

// ============================================================
// MAIN HANDLER
// ============================================================
serve(async req => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { orden_id, items, notas, comprador } = await req.json();

        // --- Supabase admin client ---
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // --- 1. Company Settings ---
        const { data: settings } = await supabase
            .from('company_settings')
            .select('*')
            .limit(1)
            .single();
        if (!settings)
            throw new Error(
                'No se encontró la configuración de empresa. Ve a Configuración y llena los datos.'
            );
        if (!settings.ruc) throw new Error('Falta configurar el RUC de la empresa.');

        // --- 2. Order + Client ---
        const { data: order } = await supabase
            .from('ordenes')
            .select('*, cliente:clientes(*), vehiculo:vehiculos(*)')
            .eq('id', orden_id)
            .single();
        if (!order) throw new Error('Orden no encontrada');

        // --- 3. Validar si ya existe factura autorizada/recibida para esta orden ---
        const { data: existingValidInvoice } = await supabase
            .from('invoices')
            .select('id, estado, secuencial')
            .eq('orden_id', orden_id)
            .in('estado', ['AUTORIZADA', 'RECIBIDA'])
            .limit(1)
            .maybeSingle();

        if (existingValidInvoice) {
            throw new Error(
                `Esta orden ya tiene una factura ${existingValidInvoice.estado} (${existingValidInvoice.secuencial}). No se puede generar otra.`
            );
        }

        // Nota: las facturas RECHAZADAS anteriores se borran MÁS TARDE, después de
        // reservar el nuevo secuencial. Así evitamos que la búsqueda de duplicados
        // encuentre el secuencial rechazado y lo reutilice en el mismo intento.

        // --- 3. Secuencial - Usar contador global seguro de company_settings ---
        // Lectura del siguiente secuencial disponible
        const { data: currentSettings } = await supabase
            .from('company_settings')
            .select('secuencial_factura')
            .limit(1)
            .single();

        let baseSeq = parseInt(currentSettings?.secuencial_factura || '1', 10);

        // Validar que el secuencial no esté duplicado en invoices recientes
        let isDuplicate = true;
        let attempts = 0;
        while (isDuplicate && attempts < 10) {
            const { data: existingSeq } = await supabase
                .from('invoices')
                .select('id')
                .like('secuencial', `${(settings.establecimiento || '001').padStart(3, '0')}-${(settings.punto_emision || '001').padStart(3, '0')}-${String(baseSeq).padStart(9, '0')}`)
                .limit(1)
                .maybeSingle();

            if (!existingSeq) {
                isDuplicate = false;
            } else {
                baseSeq++;
                attempts++;
            }
        }

        if (isDuplicate) {
            throw new Error('No se pudo asignar un secuencial válido. Contacta al administrador.');
        }

        const nextSeq = String(baseSeq).padStart(9, '0');
        const estab = (settings.establecimiento || '001').padStart(3, '0');
        const ptoEmi = (settings.punto_emision || '001').padStart(3, '0');
        const fullNumber = `${estab}-${ptoEmi}-${nextSeq}`;

        // --- 4. Tax calculations ---
        let subtotal_15 = 0;
        let subtotal_0 = 0;
        for (const item of items) {
            const price = Number(item.precio_total_sin_impuestos);
            if (item.tarifa_iva === 15) subtotal_15 += price;
            else if (item.tarifa_iva === 0) subtotal_0 += price;
            else throw new Error(`Tarifa IVA no soportada: ${item.tarifa_iva}`);
        }
        const valorIva = subtotal_15 * 0.15;
        const importeTotal = subtotal_15 + subtotal_0 + valorIva;

        // --- 5. Date (Ecuador UTC-5) ---
        const now = new Date();
        const ecOffset = -5 * 60;
        const ecTime = new Date(now.getTime() + (ecOffset + now.getTimezoneOffset()) * 60000);
        const dd = String(ecTime.getDate()).padStart(2, '0');
        const mm = String(ecTime.getMonth() + 1).padStart(2, '0');
        const yyyy = ecTime.getFullYear();
        const fechaEmision = `${dd}/${mm}/${yyyy}`;

        // --- 6. Clave de Acceso ---
        const ambiente = '2'; // 2=Producción
        const codigoNumerico = String(Math.floor(10000000 + Math.random() * 90000000));
        const claveAcceso = generateClaveAcceso(
            fechaEmision,
            '01',
            settings.ruc,
            ambiente,
            estab,
            ptoEmi,
            nextSeq,
            codigoNumerico,
            '1'
        );

        // --- 7. Build XML ---
        const facturaTotalImpuestos: any[] = [];
        if (subtotal_15 > 0) {
            facturaTotalImpuestos.push({
                codigo: '2',
                codigoPorcentaje: '4',
                baseImponible: subtotal_15.toFixed(2),
                valor: valorIva.toFixed(2),
            });
        }
        if (subtotal_0 > 0) {
            facturaTotalImpuestos.push({
                codigo: '2',
                codigoPorcentaje: '0',
                baseImponible: subtotal_0.toFixed(2),
                valor: '0.00',
            });
        }

        const xmlData = {
            claveAcceso,
            ambiente,
            tipoEmision: '1',
            razonSocial: settings.razon_social,
            nombreComercial: settings.nombre_comercial || settings.razon_social,
            ruc: settings.ruc,
            estab,
            ptoEmi,
            secuencial: nextSeq,
            dirMatriz: settings.direccion_matriz,
            contribuyenteRimpe: settings.rimpe
                ? 'CONTRIBUYENTE NEGOCIO POPULAR - RÉGIMEN RIMPE'
                : undefined,
            agenteRetencion: settings.agente_retencion || undefined,
            fechaEmision,
            obligadoContabilidad: settings.obligado_contabilidad ? 'SI' : 'NO',
            tipoIdentificacionComprador:
                comprador?.tipo_identificacion || order.cliente?.tipo_identificacion || '05',
            razonSocialComprador:
                comprador?.razon_social || order.cliente?.nombre || 'CONSUMIDOR FINAL',
            identificacionComprador:
                comprador?.identificacion || order.cliente?.cedula || '9999999999',
            direccionComprador: comprador?.direccion || order.cliente?.direccion || 'N/A',
            totalSinImpuestos: (subtotal_15 + subtotal_0).toFixed(2),
            totalDescuento: '0.00',
            totalConImpuestos: facturaTotalImpuestos,
            propina: '0.00',
            importeTotal: importeTotal.toFixed(2),
            pagos: [
                {
                    formaPago: '20',
                    total: importeTotal.toFixed(2),
                    plazo: '0',
                    unidadTiempo: 'dias',
                },
            ],
            detalles: items.map((item: any) => ({
                codigoPrincipal: item.codigo_principal,
                descripcion: item.descripcion,
                cantidad: '1.000000',
                precioUnitario: Number(item.precio_total_sin_impuestos).toFixed(6),
                descuento: '0.00',
                precioTotalSinImpuesto: Number(item.precio_total_sin_impuestos).toFixed(2),
                impuestos: [
                    {
                        codigo: '2',
                        codigoPorcentaje: item.tarifa_iva === 15 ? '4' : '0',
                        tarifa: item.tarifa_iva === 15 ? '15' : '0',
                        baseImponible: Number(item.precio_total_sin_impuestos).toFixed(2),
                        valor: (item.tarifa_iva === 15
                            ? Number(item.precio_total_sin_impuestos) * 0.15
                            : 0
                        ).toFixed(2),
                    },
                ],
            })),
            infoAdicional: [
                {
                    nombre: 'Email',
                    valor: comprador?.email || order.cliente?.email || 'N/A',
                },
                ...(comprador?.telefono ? [{ nombre: 'Telefono', valor: comprador.telefono }] : []),
                ...(notas ? [{ nombre: 'Observacion', valor: notas }] : []),
            ],
        };

        const xmlUnsigned = buildFacturaXml(xmlData);
        console.log('XML generado, longitud:', xmlUnsigned.length);
        console.log('Clave acceso generada:', claveAcceso);
        console.log('Secuencial:', fullNumber);
        console.log('XML primeros 500 chars:', xmlUnsigned.substring(0, 500));

        // --- 8. Sign XML ---
        let xmlSigned = xmlUnsigned;
        let signingError: string | null = null;

        if (settings.p12_storage_path) {
            try {
                const { data: p12Blob, error: p12Error } = await supabase.storage
                    .from('firmas')
                    .download(settings.p12_storage_path);
                if (p12Error || !p12Blob) {
                    signingError = `Error descargando firma: ${p12Error?.message || 'archivo no encontrado'}`;
                } else {
                    const p12Buffer = await p12Blob.arrayBuffer();
                    const p12Password = settings.p12_password || Deno.env.get('P12_PASSWORD') || '';
                    xmlSigned = signXmlWithP12(xmlUnsigned, p12Buffer, p12Password);
                    console.log('XML firmado exitosamente');
                }
            } catch (signErr: any) {
                signingError = `Error al firmar: ${signErr.message}`;
                console.error('Signing error:', signErr);
            }
        } else {
            signingError =
                'No hay firma electrónica (.p12) configurada. Sube tu archivo en Configuración.';
        }

        // --- 9. Send to SRI ---
        let dbStatus = 'CREADA';
        let sriMensajes: any = null;

        if (!signingError) {
            try {
                const recepcion = await sendRecepcion(xmlSigned, Number(ambiente));
                sriMensajes = recepcion;
                console.log('Recepción estado:', recepcion.estado);
                console.log('Recepción mensajes:', JSON.stringify(recepcion.mensajes));

                if (recepcion.estado === 'RECIBIDA') {
                    dbStatus = 'RECIBIDA';
                } else if (
                    recepcion.estado === 'DEVUELTA' &&
                    recepcion.mensajes?.some((m: any) => m.identificador === '70')
                ) {
                    // Error 70 = "CLAVE EN PROCESAMIENTO" — means SRI DID receive the XML
                    // and is processing it. Treat as RECIBIDA for polling purposes.
                    console.log('SRI says EN PROCESAMIENTO — treating as RECIBIDA for polling');
                    dbStatus = 'RECIBIDA';
                } else {
                    dbStatus = 'RECHAZADA';
                }
            } catch (sriErr: any) {
                console.error('SRI Recepción error:', sriErr);
                sriMensajes = { error: sriErr.message };
            }
        } else {
            sriMensajes = { error: signingError };
        }

        // --- 10. Save to DB ---
        const { data: newInvoice, error: invError } = await supabase
            .from('invoices')
            .insert({
                orden_id: order.id,
                secuencial: fullNumber,
                clave_acceso: claveAcceso,
                estado: dbStatus,
                ambiente: Number(ambiente),
                subtotal_15: Number(subtotal_15.toFixed(2)),
                subtotal_0: Number(subtotal_0.toFixed(2)),
                valor_iva: Number(valorIva.toFixed(2)),
                importe_total: Number(importeTotal.toFixed(2)),
                xml_generado: xmlSigned,
                mensajes_sri: sriMensajes,
            })
            .select()
            .single();

        if (invError) {
            console.error('Error guardando factura en BD:', invError);
        }

        // --- Update secuencial counter in company_settings ---
        // IMPORTANTE: se usa .eq con el RUC para que el UPDATE tenga un WHERE válido.
        // .limit(1).single() NO funciona en UPDATE (Supabase lo ignora silenciosamente).
        if (newInvoice) {
            const { error: seqUpdateError } = await supabase
                .from('company_settings')
                .update({ secuencial_factura: String(baseSeq + 1) })
                .eq('ruc', settings.ruc);
            if (seqUpdateError) {
                console.error('Error actualizando secuencial:', seqUpdateError.message);
            } else {
                console.log('Secuencial actualizado a:', baseSeq + 1);
            }

            // Ahora sí borramos las facturas rechazadas anteriores de esta orden,
            // ya que el nuevo secuencial ya quedó reservado en BD e incrementado.
            await supabase
                .from('invoices')
                .delete()
                .eq('orden_id', orden_id)
                .eq('estado', 'RECHAZADA')
                .neq('id', newInvoice.id);
        }

        // --- 11. Poll Autorización if RECIBIDA ---
        if (dbStatus === 'RECIBIDA' && newInvoice) {
            // Wait longer to give SRI time to process
            console.log('Waiting 5s before polling autorización...');
            await new Promise(r => setTimeout(r, 5000));

            // Try polling up to 3 times with 3s intervals
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    console.log(`Autorización poll attempt ${attempt}/3...`);
                    const autorizacion = await sendAutorizacion(claveAcceso, Number(ambiente));
                    console.log('Autorización estado:', autorizacion.estado);
                    console.log('Autorización mensajes:', JSON.stringify(autorizacion.mensajes));

                    if (autorizacion.estado === 'AUTORIZADO') {
                        await supabase
                            .from('invoices')
                            .update({
                                estado: 'AUTORIZADA',
                                autorizacion_fecha: autorizacion.fechaAutorizacion,
                                mensajes_sri: autorizacion,
                            })
                            .eq('id', newInvoice.id);
                        dbStatus = 'AUTORIZADA';
                        sriMensajes = autorizacion;

                        // --- Send invoice email to client ---
                        const emailTo = comprador?.email || order.cliente?.email;
                        if (emailTo && emailTo !== 'N/A') {
                            const emailResult = await sendInvoiceEmail({
                                to: emailTo,
                                empresa: {
                                    razon_social: settings.razon_social,
                                    ruc: settings.ruc,
                                    direccion: settings.direccion_matriz,
                                    nombre_comercial: settings.nombre_comercial,
                                    obligado_contabilidad: settings.obligado_contabilidad,
                                    rimpe: settings.rimpe,
                                    contribuyente_especial: settings.contribuyente_especial,
                                },
                                comprador: {
                                    nombre:
                                        comprador?.razon_social ||
                                        order.cliente?.nombre ||
                                        'CONSUMIDOR FINAL',
                                    identificacion:
                                        comprador?.identificacion || order.cliente?.cedula || '',
                                    direccion:
                                        comprador?.direccion || order.cliente?.direccion || 'N/A',
                                    email: emailTo,
                                    telefono: comprador?.telefono || order.cliente?.telefono || '',
                                },
                                factura: {
                                    secuencial: fullNumber,
                                    claveAcceso,
                                    fechaEmision,
                                    fechaAutorizacion:
                                        autorizacion.fechaAutorizacion || new Date().toISOString(),
                                    items: items.map((item: any) => ({
                                        codigo: item.codigo_principal || 'SERV',
                                        descripcion: item.descripcion,
                                        cantidad: '1.00',
                                        precioUnitario: Number(
                                            item.precio_total_sin_impuestos
                                        ).toFixed(2),
                                        subtotal: Number(item.precio_total_sin_impuestos).toFixed(
                                            2
                                        ),
                                        descuento: '0.00',
                                    })),
                                    subtotal0: subtotal_0.toFixed(2),
                                    subtotal15: subtotal_15.toFixed(2),
                                    subtotalSinImpuestos: (subtotal_15 + subtotal_0).toFixed(2),
                                    totalDescuento: '0.00',
                                    totalIva: valorIva.toFixed(2),
                                    importeTotal: importeTotal.toFixed(2),
                                    formaPago: '01',
                                    formaPagoDescripcion: 'SIN UTILIZACIÓN DEL SISTEMA FINANCIERO',
                                },
                                vehiculo: order.vehiculo
                                    ? {
                                          placa: order.vehiculo.placa,
                                          marca: order.vehiculo.marca,
                                          modelo: order.vehiculo.modelo,
                                      }
                                    : undefined,
                                notas: notas || undefined,
                            });
                            console.log(
                                'Email result:',
                                emailResult.success ? 'SENT' : emailResult.error
                            );
                        } else {
                            console.log('No client email provided, skipping email.');
                        }

                        break;
                    } else if (
                        autorizacion.estado === 'NO AUTORIZADO' ||
                        autorizacion.estado === 'RECHAZADO'
                    ) {
                        await supabase
                            .from('invoices')
                            .update({
                                estado: 'RECHAZADA',
                                mensajes_sri: autorizacion,
                            })
                            .eq('id', newInvoice.id);
                        dbStatus = 'RECHAZADA';
                        sriMensajes = autorizacion;
                        break;
                    } else {
                        // Still processing, wait before next attempt
                        console.log(`Still processing, waiting 3s...`);
                        if (attempt < 3) {
                            await new Promise(r => setTimeout(r, 3000));
                        }
                    }
                } catch (autoErr: any) {
                    console.log(`Autorización poll attempt ${attempt} error:`, autoErr.message);
                }
            }

            // If after all polls, still not resolved, mark as RECIBIDA (not RECHAZADA)
            if (dbStatus === 'RECIBIDA') {
                console.log('All polls exhausted — invoice still processing at SRI.');
            }
        }

        // --- 12. Response ---
        const responseBody: any = {
            success: true,
            status: dbStatus,
            clave_acceso: claveAcceso,
            secuencial: fullNumber,
        };

        if (signingError) {
            responseBody.warning = signingError;
        }
        if (sriMensajes?.mensajes?.length > 0) {
            responseBody.sri_mensajes = sriMensajes.mensajes;
        }
        // Include full SRI response details for debugging RECHAZADA
        if (dbStatus === 'RECHAZADA' && sriMensajes) {
            responseBody.sri_detalle = sriMensajes;
        }

        return new Response(JSON.stringify(responseBody), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        console.error('Invoice function error:', error.message);
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
