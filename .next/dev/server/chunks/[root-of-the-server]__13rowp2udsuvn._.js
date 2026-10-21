module.exports = [
(()=>{"use strict";return[
"[project]/src/app/api/stats/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api-helpers.ts [app-route] (ecmascript)");
;
;
async function GET(req) {
    try {
        const url = new URL(req.url);
        const code = url.searchParams.get('company') || 'ACME';
        const company = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].company.findUnique({
            where: {
                code
            }
        });
        if (!company) return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["json"])({
            error: 'Company not found'
        }, 404);
        const companyId = company.id;
        const now = new Date();
        const in60 = new Date(now.getTime() + 60 * 86400000);
        const [total, assigned, repair, retired, inStock, warrantyHw, licExpiring] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.count({
                where: {
                    companyId
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.count({
                where: {
                    companyId,
                    status: 'ASSIGNED'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.count({
                where: {
                    companyId,
                    status: 'REPAIR'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.count({
                where: {
                    companyId,
                    status: 'RETIRED'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.count({
                where: {
                    companyId,
                    status: 'IN_STOCK'
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.count({
                where: {
                    companyId,
                    warrantyEnd: {
                        gte: now,
                        lte: in60
                    }
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].softwareLicense.count({
                where: {
                    companyId,
                    expiresAt: {
                        gte: now,
                        lte: in60
                    }
                }
            })
        ]);
        const byCategory = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.groupBy({
            by: [
                'category'
            ],
            where: {
                companyId
            },
            _count: {
                _all: true
            },
            _sum: {
                purchaseCost: true
            }
        });
        // assignment trend over the last 6 months
        const trend = [];
        for(let i = 5; i >= 0; i--){
            const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
            const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1));
            const [a, r] = await Promise.all([
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assignment.count({
                    where: {
                        asset: {
                            companyId
                        },
                        issuedAt: {
                            gte: start,
                            lt: end
                        }
                    }
                }),
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].returnRecord.count({
                    where: {
                        assignment: {
                            asset: {
                                companyId
                            }
                        },
                        returnedAt: {
                            gte: start,
                            lt: end
                        }
                    }
                })
            ]);
            const label = start.toLocaleString('en-US', {
                month: 'short'
            });
            trend.push({
                month: label,
                assigned: a,
                returned: r
            });
        }
        const [openRepairs, repairCost, employeesCount, vendorsCount, licensesCount] = await Promise.all([
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].repairRecord.count({
                where: {
                    asset: {
                        companyId
                    },
                    status: {
                        not: 'RESOLVED'
                    }
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].repairRecord.aggregate({
                where: {
                    asset: {
                        companyId
                    }
                },
                _sum: {
                    repairCost: true
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].employee.count({
                where: {
                    companyId
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].vendor.count({
                where: {
                    companyId
                }
            }),
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].softwareLicense.count({
                where: {
                    companyId
                }
            })
        ]);
        const recentAudit = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].auditLog.findMany({
            orderBy: {
                timestamp: 'desc'
            },
            take: 8
        });
        const auditCount = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].auditLog.count();
        const expiringSoon = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.findMany({
            where: {
                companyId,
                warrantyEnd: {
                    gte: now,
                    lte: in60
                }
            },
            orderBy: {
                warrantyEnd: 'asc'
            },
            take: 6,
            select: {
                assetTag: true,
                name: true,
                warrantyEnd: true,
                status: true
            }
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["json"])({
            kpis: {
                total,
                assigned,
                repair,
                inStock,
                retired,
                utilization: total ? Math.trunc(assigned / total * 1000) / 10 : 0,
                downtime: total ? Math.trunc(repair / total * 1000) / 10 : 0,
                warrantyAlerts: warrantyHw + licExpiring,
                warrantyHw,
                licExpiring
            },
            byCategory: byCategory.map((c)=>({
                    category: c.category,
                    count: c._count._all,
                    value: c._sum.purchaseCost ?? 0
                })),
            trend,
            openRepairs,
            repairCost: repairCost._sum.repairCost ?? 0,
            employeesCount,
            vendorsCount,
            licensesCount,
            auditCount,
            recentAudit,
            expiringSoon
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

//# sourceMappingURL=%5Broot-of-the-server%5D__13rowp2udsuvn._.js.map