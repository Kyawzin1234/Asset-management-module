module.exports = [
(()=>{"use strict";return[
"[project]/src/app/api/reports/preview/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api-helpers.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$reports$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/lib/reports.ts [app-route] (ecmascript) <locals>");
;
;
async function GET(req) {
    try {
        const url = new URL(req.url);
        const category = url.searchParams.get('category') || 'audit';
        const company = url.searchParams.get('company') || 'ACME';
        const filterA = url.searchParams.get('filterA') || 'ALL';
        const filterB = url.searchParams.get('filterB') || 'ALL';
        const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
        const pageSize = Math.max(5, parseInt(url.searchParams.get('pageSize') || '5'));
        const section = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$reports$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["buildReport"])({
            category,
            companyCode: company,
            filterA,
            filterB,
            limit: pageSize,
            offset: (page - 1) * pageSize
        });
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["json"])({
            ...section,
            page,
            pageSize,
            refreshedAt: new Date().toISOString()
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
"[project]/src/lib/reports.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "REPORT_CATEGORIES",
    ()=>REPORT_CATEGORIES,
    "buildReport",
    ()=>buildReport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api-helpers.ts [app-route] (ecmascript)");
;
;
const REPORT_CATEGORIES = [
    {
        key: 'inventory',
        num: 1,
        name: 'Current Inventory Master',
        badge: 'Core',
        desc: 'Master hardware list. Serial tags, condition, purchase costs & company ownership.'
    },
    {
        key: 'employee',
        num: 2,
        name: 'Employee Asset Statement',
        badge: 'Custody',
        desc: 'Comprehensive breakdown of all hardware & software keys issued per employee.'
    },
    {
        key: 'assignment',
        num: 3,
        name: 'Assignment Register',
        badge: 'Handover',
        desc: 'Signed handover receipts, issuance dates, expected return dates & signoffs.'
    },
    {
        key: 'transfer',
        num: 4,
        name: 'Transfer History Log',
        badge: 'Chain',
        desc: 'Inter-departmental and inter-company custody transfers and historical lineage.'
    },
    {
        key: 'repair',
        num: 5,
        name: 'Defective / Repair Register',
        badge: 'Maintenance',
        desc: 'RMA cases, vendor service tickets, repair costs, and downtime tracking.'
    },
    {
        key: 'expiry',
        num: 6,
        name: 'Expiry & Warranty Report',
        badge: 'Lifecycle',
        desc: 'Upcoming hardware warranty end dates and software license expiration timelines.'
    },
    {
        key: 'audit',
        num: 7,
        name: 'System Asset Audit Trail',
        badge: 'Security',
        desc: 'Immutable event history, administrative field changes, and operator stamps.'
    }
];
const STATUS_TONE = {
    IN_STOCK: 'green',
    ASSIGNED: 'blue',
    REPAIR: 'red',
    RETIRED: 'muted',
    ACTIVE: 'green',
    RETURNED: 'muted',
    OPEN: 'red',
    IN_PROGRESS: 'amber',
    RESOLVED: 'green'
};
function d(value) {
    if (!value) return '—';
    const dt = new Date(value);
    const p = (n)=>String(n).padStart(2, '0');
    return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}`;
}
async function buildReport(opts) {
    const companyCode = opts.companyCode || 'ACME';
    const company = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].company.findUnique({
        where: {
            code: companyCode
        }
    });
    const companyId = company?.id;
    const limit = opts.limit ?? 5;
    const offset = opts.offset ?? 0;
    const take = opts.forExport ? 5000 : limit;
    const skip = opts.forExport ? 0 : offset;
    const fA = opts.filterA && opts.filterA !== 'ALL' ? opts.filterA : null;
    const fB = opts.filterB && opts.filterB !== 'ALL' ? opts.filterB : null;
    switch(opts.category){
        case 'inventory':
            {
                const where = {
                    companyId,
                    ...fA ? {
                        category: fA
                    } : {},
                    ...fB ? {
                        status: fB
                    } : {}
                };
                const [total, assets] = await Promise.all([
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.count({
                        where
                    }),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.findMany({
                        where,
                        orderBy: {
                            createdAt: 'desc'
                        },
                        skip,
                        take,
                        include: {
                            assignments: {
                                where: {
                                    status: 'ACTIVE'
                                },
                                include: {
                                    employee: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    })
                ]);
                return {
                    key: 'inventory',
                    title: 'Current Inventory Master',
                    headers: [
                        'ASSET TAG',
                        'MODEL / SERIAL',
                        'CATEGORY',
                        'STATUS',
                        'CONDITION',
                        'ASSIGNED CUSTODIAN',
                        'PURCHASE COST'
                    ],
                    rows: assets.map((a)=>[
                            {
                                text: a.assetTag,
                                tone: 'asset'
                            },
                            {
                                text: `${a.name} · ${a.serialNumber ?? '—'}`
                            },
                            {
                                text: a.category
                            },
                            {
                                text: a.status.replace('_', ' ').replace(/\b\w/g, (c)=>c.toUpperCase()),
                                tone: STATUS_TONE[a.status]
                            },
                            {
                                text: a.condition,
                                tone: a.condition === 'Poor' ? 'red' : a.condition === 'Fair' ? 'amber' : 'green'
                            },
                            {
                                text: a.assignments[0]?.employee?.name ?? 'Unassigned',
                                tone: a.assignments[0] ? undefined : 'muted'
                            },
                            {
                                text: '$' + a.purchaseCost.toLocaleString('en-US')
                            }
                        ]),
                    total
                };
            }
        case 'employee':
            {
                const emps = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].employee.findMany({
                    where: {
                        companyId,
                        ...fA ? {
                            department: fA
                        } : {},
                        ...fB ? {
                            name: {
                                contains: fB
                            }
                        } : {}
                    },
                    orderBy: {
                        name: 'asc'
                    }
                });
                const ids = emps.map((e)=>e.id);
                const asgGroups = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assignment.groupBy({
                    by: [
                        'employeeId'
                    ],
                    where: {
                        employeeId: {
                            in: ids
                        },
                        status: 'ACTIVE'
                    },
                    _count: {
                        _all: true
                    }
                });
                const asgMap = new Map(asgGroups.map((g)=>[
                        g.employeeId,
                        g._count._all
                    ]));
                const total = emps.length;
                const page = emps.slice(skip, skip + take);
                const rows = [];
                for (const e of page){
                    const active = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].assignment.findFirst({
                        where: {
                            employeeId: e.id,
                            status: 'ACTIVE'
                        },
                        orderBy: {
                            issuedAt: 'desc'
                        },
                        select: {
                            issuedAt: true
                        }
                    });
                    rows.push([
                        {
                            text: e.name,
                            tone: 'strong'
                        },
                        {
                            text: `${e.designation} · ${e.department}`
                        },
                        {
                            text: e.empCode,
                            tone: 'mono'
                        },
                        {
                            text: String(asgMap.get(e.id) ?? 0)
                        },
                        {
                            text: e.location ?? '—'
                        },
                        {
                            text: active ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatIST"])(active.issuedAt).replace(' IST', '') : '—',
                            tone: active ? undefined : 'muted'
                        }
                    ]);
                }
                return {
                    key: 'employee',
                    title: 'Employee Asset Statement',
                    headers: [
                        'EMPLOYEE',
                        'DESIGNATION / DEPARTMENT',
                        'EMPLOYEE ID',
                        'ASSETS HELD',
                        'LOCATION',
                        'LAST ISSUED (IST)'
                    ],
                    rows,
                    total
                };
            }
        case 'assignment':
            {
                const where = {
                    status: 'ACTIVE',
                    asset: {
                        companyId,
                        ...fA ? {
                            category: fA
                        } : {}
                    },
                    ...fB ? {
                        employee: {
                            department: fB
                        }
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
                        skip,
                        take,
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
                                    department: true
                                }
                            }
                        }
                    })
                ]);
                return {
                    key: 'assignment',
                    title: 'Assignment Register',
                    headers: [
                        'RECEIPT ID',
                        'ASSET TAG',
                        'ASSET',
                        'ISSUED TO',
                        'ISSUED ON (IST)',
                        'EXPECTED RETURN',
                        'SIGNOFF'
                    ],
                    rows: list.map((a)=>[
                            {
                                text: a.receiptId,
                                tone: 'mono'
                            },
                            {
                                text: a.asset.assetTag,
                                tone: 'asset'
                            },
                            {
                                text: a.asset.name
                            },
                            {
                                text: `${a.employee.name} (${a.employee.department})`
                            },
                            {
                                text: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatIST"])(a.issuedAt).replace(' IST', '')
                            },
                            {
                                text: d(a.expectedReturnAt),
                                tone: 'muted'
                            },
                            {
                                text: a.signoffBy ?? 'Signed',
                                tone: 'green'
                            }
                        ]),
                    total
                };
            }
        case 'transfer':
            {
                const where = {
                    assignment: {
                        asset: {
                            companyId
                        }
                    },
                    ...fA ? {
                        toDept: fA
                    } : {},
                    ...fB ? {
                        operator: fB
                    } : {}
                };
                const [total, list] = await Promise.all([
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].transferRecord.count({
                        where
                    }),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].transferRecord.findMany({
                        where,
                        orderBy: {
                            transferredAt: 'desc'
                        },
                        skip,
                        take,
                        include: {
                            assignment: {
                                include: {
                                    asset: {
                                        select: {
                                            assetTag: true,
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    })
                ]);
                return {
                    key: 'transfer',
                    title: 'Transfer History Log',
                    headers: [
                        'TRANSFER ID',
                        'ASSET TAG',
                        'FROM',
                        'TO',
                        'OPERATOR',
                        'DATE (IST)',
                        'CHAIN REF'
                    ],
                    rows: list.map((t)=>[
                            {
                                text: t.transferId,
                                tone: 'mono'
                            },
                            {
                                text: t.assignment.asset.assetTag,
                                tone: 'asset'
                            },
                            {
                                text: t.fromDept
                            },
                            {
                                text: t.toDept,
                                tone: 'blue'
                            },
                            {
                                text: t.operator
                            },
                            {
                                text: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatIST"])(t.transferredAt).replace(' IST', '')
                            },
                            {
                                text: t.transferId.replace('TRF', 'CHN'),
                                tone: 'mono'
                            }
                        ]),
                    total
                };
            }
        case 'repair':
            {
                const where = {
                    asset: {
                        companyId
                    },
                    ...fA ? {
                        status: fA
                    } : {},
                    ...fB ? {
                        vendor: {
                            name: fB
                        }
                    } : {}
                };
                const [total, list] = await Promise.all([
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].repairRecord.count({
                        where
                    }),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].repairRecord.findMany({
                        where,
                        orderBy: {
                            reportedAt: 'desc'
                        },
                        skip,
                        take,
                        include: {
                            asset: {
                                select: {
                                    assetTag: true,
                                    name: true
                                }
                            },
                            vendor: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    })
                ]);
                return {
                    key: 'repair',
                    title: 'Defective / Repair Register',
                    headers: [
                        'RMA CASE',
                        'ASSET TAG',
                        'ISSUE',
                        'VENDOR',
                        'COST',
                        'DOWNTIME',
                        'STATUS'
                    ],
                    rows: list.map((r)=>[
                            {
                                text: r.rmaNumber,
                                tone: 'mono'
                            },
                            {
                                text: r.asset.assetTag,
                                tone: 'asset'
                            },
                            {
                                text: r.issue
                            },
                            {
                                text: r.vendor?.name ?? '—'
                            },
                            {
                                text: '$' + r.repairCost.toLocaleString('en-US')
                            },
                            {
                                text: r.downtimeDays + ' days',
                                tone: r.downtimeDays > 10 ? 'red' : 'muted'
                            },
                            {
                                text: r.status.replace('_', ' '),
                                tone: STATUS_TONE[r.status]
                            }
                        ]),
                    total
                };
            }
        case 'expiry':
            {
                const includeHardware = !fA || fA === 'ALL' || fA !== 'Software License';
                const includeSoftware = !fA || fA === 'ALL' || fA === 'Software License';
                const assets = includeHardware ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.findMany({
                    where: {
                        companyId,
                        warrantyEnd: {
                            not: null
                        },
                        ...fA && fA !== 'ALL' && fA !== 'Software License' ? {
                            category: fA
                        } : {}
                    },
                    include: {
                        assignments: {
                            where: {
                                status: 'ACTIVE'
                            },
                            include: {
                                employee: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        warrantyEnd: 'asc'
                    }
                }) : [];
                const licenses = includeSoftware ? await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].softwareLicense.findMany({
                    where: {
                        companyId,
                        expiresAt: {
                            not: null
                        }
                    },
                    include: {
                        vendor: {
                            select: {
                                name: true
                            }
                        }
                    },
                    orderBy: {
                        expiresAt: 'asc'
                    }
                }) : [];
                const items = [
                    ...assets.map((a)=>({
                            tag: a.assetTag,
                            type: a.category,
                            vendor: a.name.split(' ')[0] ?? '—',
                            purchased: a.purchaseDate,
                            expires: a.warrantyEnd,
                            custodian: a.assignments[0]?.employee?.name ?? 'Unassigned'
                        })),
                    ...licenses.map((l)=>({
                            tag: l.name,
                            type: 'Software License',
                            vendor: l.vendor?.name ?? '—',
                            purchased: l.createdAt,
                            expires: l.expiresAt,
                            custodian: l.seats + ' seats'
                        }))
                ];
                items.sort((a, b)=>a.expires.getTime() - b.expires.getTime());
                const now = Date.now();
                const window = fB === '30d' ? 30 : fB === '60d' ? 60 : fB === '90d' ? 90 : null;
                const filtered = window ? items.filter((i)=>i.expires.getTime() - now <= window * 86400000) : items;
                const page = filtered.slice(skip, skip + take);
                return {
                    key: 'expiry',
                    title: 'Expiry & Warranty Report',
                    headers: [
                        'ITEM',
                        'TYPE',
                        'VENDOR / BRAND',
                        'CUSTODIAN / SEATS',
                        'EXPIRY DATE',
                        'DAYS LEFT'
                    ],
                    rows: page.map((i)=>{
                        const days = Math.ceil((i.expires.getTime() - now) / 86400000);
                        return [
                            {
                                text: i.tag,
                                tone: i.type === 'Software License' ? 'strong' : 'asset'
                            },
                            {
                                text: i.type
                            },
                            {
                                text: i.vendor
                            },
                            {
                                text: i.custodian
                            },
                            {
                                text: d(i.expires),
                                tone: days <= 30 ? 'red' : days <= 60 ? 'amber' : 'green'
                            },
                            {
                                text: days <= 0 ? 'EXPIRED' : days + ' days',
                                tone: days <= 30 ? 'red' : days <= 60 ? 'amber' : 'green'
                            }
                        ];
                    }),
                    total: filtered.length
                };
            }
        case 'audit':
        default:
            {
                // Figma parameter panel: Company Scope | Hardware Category | Asset Status | Target Export Format
                // filterA = hardware category of the affected asset; filterB = asset-state event mapping
                const where = {};
                if (fA) {
                    const tags = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].asset.findMany({
                        where: {
                            category: fA,
                            companyId
                        },
                        select: {
                            assetTag: true
                        }
                    });
                    where.affectedRecord = {
                        in: tags.map((t)=>t.assetTag)
                    };
                }
                if (fB) {
                    const map = {
                        ASSIGNED: 'Asset Assignment',
                        RETURNED: 'Asset Return',
                        REPAIR: 'Repair Intake',
                        CONFIG: 'System Config Edit',
                        TRANSFER: 'Custody Transfer',
                        REGISTRATION: 'Asset Registration'
                    };
                    if (map[fB]) where.category = map[fB];
                }
                const [total, list] = await Promise.all([
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].auditLog.count({
                        where
                    }),
                    __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].auditLog.findMany({
                        where,
                        orderBy: {
                            timestamp: 'desc'
                        },
                        skip,
                        take
                    })
                ]);
                const rows = list.map((l)=>[
                        {
                            text: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2d$helpers$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatIST"])(l.timestamp),
                            tone: 'mono'
                        },
                        {
                            text: l.category
                        },
                        {
                            text: l.operator
                        },
                        {
                            text: l.affectedRecord,
                            tone: l.affectedRecord.startsWith('AST-') ? 'asset' : 'strong'
                        },
                        {
                            text: l.actionDetails
                        },
                        {
                            text: l.checksum,
                            tone: 'green'
                        }
                    ]);
                return {
                    key: 'audit',
                    title: 'System Asset Audit Trail',
                    headers: [
                        'EVENT TIMESTAMP',
                        'EVENT CATEGORY',
                        'OPERATOR',
                        'AFFECTED ASSET / RECORD',
                        'ACTION DETAILS / SUMMARY',
                        'SECURITY CHECKSUM'
                    ],
                    rows,
                    total
                };
            }
    }
}
;
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

//# sourceMappingURL=%5Broot-of-the-server%5D__20_vlp3g0142o._.js.map