module.exports = [
(()=>{"use strict";return[
"[project]/src/app/api/assignments/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api-helpers.ts [app-route] (ecmascript)");
;
;
async function GET(req) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('company') || 'ACME';
        const status = url.searchParams.get('status') || 'ACTIVE';
        const q = url.searchParams.get('q') || '';
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const pageSize = Math.min(100, Math.max(5, parseInt(url.searchParams.get('pageSize') || '10')));
        const company = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].company.findUnique({
            where: {
                code
            }
        });
        if (!company) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["badRequest"])('Unknown company scope');
        const where = {
            status,
            asset: {
                companyId: company.id
            },
            ...q ? {
                OR: [
                    {
                        receiptId: {
                            contains: q
                        }
                    },
                    {
                        asset: {
                            assetTag: {
                                contains: q
                            }
                        }
                    },
                    {
                        employee: {
                            name: {
                                contains: q
                            }
                        }
                    }
                ]
            } : {}
        };
        const [total, list] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assignment.count({
                where
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assignment.findMany({
                where,
                orderBy: {
                    issuedAt: 'desc'
                },
                skip: (page - 1) * pageSize,
                take: pageSize,
                include: {
                    asset: {
                        select: {
                            assetTag: true,
                            name: true,
                            category: true
                        }
                    },
                    employee: {
                        select: {
                            name: true,
                            department: true,
                            designation: true
                        }
                    }
                }
            })
        ]);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["json"])({
            assignments: list,
            total,
            page,
            pageSize
        });
    } catch (e) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serverError"])(e);
    }
}
async function POST(req) {
    try {
        const body = await req.json();
        if (!body.assetId || !body.employeeId) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["badRequest"])('Asset and employee are required');
        const asset = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.findUnique({
            where: {
                id: body.assetId
            },
            include: {
                company: true
            }
        });
        if (!asset) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["badRequest"])('Asset not found');
        if (asset.status !== 'IN_STOCK') return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["badRequest"])('Only in-stock assets can be assigned');
        const employee = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].employee.findUnique({
            where: {
                id: body.employeeId
            }
        });
        if (!employee) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["badRequest"])('Employee not found');
        const count = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assignment.count();
        const asg = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].$transaction(async (tx)=>{
            const created = await tx.assignment.create({
                data: {
                    receiptId: `ASG-${new Date().getFullYear()}-${String(count + 1).padStart(5, '0')}`,
                    assetId: asset.id,
                    employeeId: employee.id,
                    expectedReturnAt: body.expectedReturnAt ? new Date(body.expectedReturnAt) : new Date(Date.now() + 365 * 86400000),
                    signoffBy: body.signoffBy || 'Sarah Jenkins',
                    notes: body.notes || 'Signed handover receipt on file.',
                    status: 'ACTIVE'
                }
            });
            await tx.asset.update({
                where: {
                    id: asset.id
                },
                data: {
                    status: 'ASSIGNED'
                }
            });
            return created;
        });
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["audit"])({
            category: 'Asset Assignment',
            affectedRecord: asset.assetTag,
            actionDetails: `Assigned custody to ${employee.name} (${employee.department})`
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["json"])({
            assignment: asg
        });
    } catch (e) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serverError"])(e);
    }
}
}),
"[project]/src/lib/api-helpers.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ASSET_STATUSES",
    ()=>ASSET_STATUSES,
    "HW_CATEGORIES",
    ()=>HW_CATEGORIES,
    "audit",
    ()=>audit,
    "badRequest",
    ()=>badRequest,
    "checksum",
    ()=>checksum,
    "csvEscape",
    ()=>csvEscape,
    "formatIST",
    ()=>formatIST,
    "formatISTShort",
    ()=>formatISTShort,
    "json",
    ()=>json,
    "resolveCompany",
    ()=>resolveCompany,
    "serverError",
    ()=>serverError,
    "toCSV",
    ()=>toCSV,
    "toExcelXML",
    ()=>toExcelXML
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
;
function json(data, status = 200) {
    return Response.json(data, {
        status
    });
}
function badRequest(msg) {
    return Response.json({
        error: msg
    }, {
        status: 400
    });
}
function serverError(e) {
    console.error('[API Error]', e);
    return Response.json({
        error: 'Internal server error'
    }, {
        status: 500
    });
}
async function resolveCompany(code) {
    if (!code) return null;
    return __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].company.findUnique({
        where: {
            code
        }
    });
}
function formatIST(d) {
    const date = typeof d === 'string' ? new Date(d) : d;
    const ist = new Date(date.getTime() + 5.5 * 3600 * 1000);
    const p = (n)=>String(n).padStart(2, '0');
    return `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())} ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())}:${p(ist.getUTCSeconds())} IST`;
}
function formatISTShort(d) {
    const date = typeof d === 'string' ? new Date(d) : d;
    const ist = new Date(date.getTime() + 5.5 * 3600 * 1000);
    const months = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];
    const p = (n)=>String(n).padStart(2, '0');
    return `${months[ist.getUTCMonth()]} ${ist.getUTCDate()}, ${ist.getUTCFullYear()} • ${p(ist.getUTCHours())}:${p(ist.getUTCMinutes())} IST`;
}
function checksum() {
    return '0x' + Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase().padStart(6, '0');
}
async function audit(opts) {
    await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].auditLog.create({
        data: {
            category: opts.category,
            operator: opts.operator ?? 'Sarah Jenkins',
            affectedRecord: opts.affectedRecord,
            actionDetails: opts.actionDetails,
            checksum: checksum(),
            severity: opts.severity ?? 'INFO'
        }
    });
}
function csvEscape(v) {
    const s = String(v ?? '');
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}
function toCSV(headers, rows) {
    const lines = [
        headers.map(csvEscape).join(',')
    ];
    for (const r of rows)lines.push(r.map(csvEscape).join(','));
    return '\uFEFF' + lines.join('\n');
}
function toExcelXML(sheetName, headers, rows) {
    const esc = (s)=>String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const cell = (v)=>{
        if (typeof v === 'number' && isFinite(v)) return `<Cell><Data ss:Type="Number">${v}</Data></Cell>`;
        return `<Cell><Data ss:Type="String">${esc(v)}</Data></Cell>`;
    };
    const headerRow = `<Row>${headers.map((h)=>`<Cell ss:StyleID="hdr"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>`;
    const bodyRows = rows.map((r)=>`<Row>${r.map(cell).join('')}</Row>`).join('\n');
    return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="hdr">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1570EF" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${esc(sheetName).slice(0, 30)}">
  <Table>${headerRow}
${bodyRows}
  </Table>
 </Worksheet>
</Workbook>`;
}
const HW_CATEGORIES = [
    'Laptop',
    'Monitor',
    'Phone',
    'Tablet',
    'Printer',
    'Server',
    'Networking',
    'Peripheral'
];
const ASSET_STATUSES = [
    'IN_STOCK',
    'ASSIGNED',
    'REPAIR',
    'RETIRED'
];
}),
"[project]/src/lib/db.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "db",
    ()=>db
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/node_modules/@prisma/client)");
;
const globalForPrisma = globalThis;
const db = globalForPrisma.prisma ?? new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        'query'
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = db;
}),
]})(),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1_7fm7wkyx4mf._.js.map