# Desarrollo local

1. Instalar Node.js 24 y pnpm 10.
2. Ejecutar `pnpm install --frozen-lockfile`.
3. Ejecutar `pnpm dev` y abrir la dirección local indicada.
4. Usar únicamente fixtures sintéticos para pruebas versionadas.
5. Antes de una PR, ejecutar `pnpm verify`.

Los CSV reales pueden abrirse manualmente en la aplicación local porque el navegador los procesa en memoria. Nunca deben copiarse al directorio del repositorio.
