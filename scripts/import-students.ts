import "dotenv/config";
import * as Papa from "papaparse";
import * as fs from "fs";
import { importStudentsBulk, validateCsvColumns, VALID_IMPORT_COLUMNS, REQUIRED_IMPORT_COLUMNS } from "@/lib/db/service";

function printHeader() {
  console.log("=".repeat(60));
  console.log("  IMPORTACIÓN DE ESTUDIANTES");
  console.log("=".repeat(60));
}

function printValidColumns() {
  console.log("\nColumnas válidas para importación:");
  console.log(`  ${VALID_IMPORT_COLUMNS.join(", ")}`);
  console.log("\nColumnas requeridas:");
  console.log(`  ${REQUIRED_IMPORT_COLUMNS.join(", ")}`);
}

async function main() {
  printHeader();

  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("\n❌ Error: Se requiere la ruta del archivo CSV.");
    console.error("\nUso: npx tsx scripts/import-students.ts <archivo.csv>\n");
    printValidColumns();
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ Error: El archivo "${filePath}" no existe.\n`);
    process.exit(1);
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");

  console.log(`\n📄 Archivo: ${filePath}`);

  const { data, errors, meta } = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim(),
  });

  if (errors.length > 0) {
    console.error("\n❌ Error al analizar el archivo CSV:");
    errors.forEach((err) => console.error(`  - Fila ${err.row}: ${err.message}`));
    process.exit(1);
  }

  const headers = meta.fields || [];

  if (headers.length === 0) {
    console.error("\n❌ Error: No se pudieron leer los encabezados del archivo CSV.\n");
    process.exit(1);
  }

  console.log(`📊 Encabezados encontrados: ${headers.length}`);
  console.log(`📋 ${headers.join(", ")}`);

  const validation = validateCsvColumns(headers);

  if (!validation.valid) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR DE VALIDACIÓN DE COLUMNAS");
    console.error("=".repeat(60));

    if (validation.missingColumns.length > 0) {
      console.error(`\n🔴 Columnas requeridas faltantes:`);
      console.error(`   ${validation.missingColumns.join(", ")}`);
    }

    if (validation.unknownColumns.length > 0) {
      console.error(`\n🟡 Columnas no soportadas encontradas:`);
      console.error(`   ${validation.unknownColumns.join(", ")}`);
      console.error("\n   Las siguientes columnas no son válidas y deben ser removidas del archivo CSV.");
    }

    printValidColumns();
    process.exit(1);
  }

  console.log("\n✅ Encabezados validados correctamente.");

  if (data.length === 0) {
    console.error("\n⚠️  Advertencia: El archivo CSV está vacío o no tiene filas de datos.\n");
    process.exit(1);
  }

  console.log(`📝 Total de filas a procesar: ${data.length}\n`);

  try {
    const summary = await importStudentsBulk(data);

    console.log("=".repeat(60));
    console.log("📊 RESUMEN DE IMPORTACIÓN");
    console.log("=".repeat(60));
    console.log(`   Total de filas procesadas: ${summary.total}`);
    console.log(`   ✅ Creados exitosamente:     ${summary.created}`);
    console.log(`   ⏭️  Omitidos (duplicados):   ${summary.skipped}`);
    console.log(`   ❌ Errores:                  ${summary.errors}`);
    console.log("=".repeat(60));

    if (summary.results.length > 0) {
      console.log("\n📋 Detalle de resultados:");
      console.log("-".repeat(60));

      const errorsOnly = summary.results.filter((r) => r.status === "error");
      const skippedOnly = summary.results.filter((r) => r.status === "skipped");
      const createdOnly = summary.results.filter((r) => r.status === "created");

      if (errorsOnly.length > 0) {
        console.log("\n❌ ERRORES:");
        errorsOnly.slice(0, 20).forEach((result) => {
          console.log(`   Fila ${result.row} (${result.cedula}): ${result.reason || "Error desconocido"}`);
        });
        if (errorsOnly.length > 20) {
          console.log(`   ... y ${errorsOnly.length - 20} errores más`);
        }
      }

      if (skippedOnly.length > 0) {
        console.log("\n⏭️  DUPLICADOS OMITIDOS:");
        skippedOnly.slice(0, 20).forEach((result) => {
          console.log(`   Fila ${result.row} (${result.cedula}): ${result.reason || "Cédula duplicada"}`);
        });
        if (skippedOnly.length > 20) {
          console.log(`   ... y ${skippedOnly.length - 20} duplicados más`);
        }
      }

      if (createdOnly.length > 0) {
        console.log(`\n✅ Primeros ${Math.min(10, createdOnly.length)} estudiantes creados:`);
        createdOnly.slice(0, 10).forEach((result) => {
          console.log(`   Fila ${result.row} - Cédula: ${result.cedula}`);
        });
        if (createdOnly.length > 10) {
          console.log(`   ... y ${createdOnly.length - 10} estudiantes más`);
        }
      }
    }

    if (summary.downloadableRows.length > 0) {
      const outputFile = filePath.replace(/\.csv$/i, "-import-report.csv");
      const report = Papa.unparse(summary.downloadableRows);
      fs.writeFileSync(outputFile, report);
      console.log(`\n📄 Reporte de errores guardado en: ${outputFile}`);
    }

    console.log("");

    if (summary.errors > 0) {
      console.log("⚠️  La importación terminó con errores. Revise el reporte para más detalles.\n");
      process.exit(1);
    }

    console.log("✅ Importación completada exitosamente.\n");
  } catch (error) {
    console.error("\n❌ Error durante la importación:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
