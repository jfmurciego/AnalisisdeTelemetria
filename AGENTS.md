# Reglas de trabajo

1. No incorporar telemetría real, trazas GPS, credenciales ni exportaciones locales.
2. Toda métrica derivada debe declarar fórmula, unidades, entradas y versión.
3. Un dato inválido se representa como ausente; nunca se convierte en cero ni se interpola silenciosamente.
4. Los cambios funcionales se hacen en rama, mediante PR y con pruebas.
5. `main` representa un estado verificable. Las etiquetas SemVer identifican releases.
6. `legacy/` solo contiene instantáneas documentales de hitos publicados.
7. Ninguna recomendación de conducción se presenta como garantía o control autónomo.
8. No desplegar, publicar, fusionar ni modificar integraciones externas sin autorización expresa.
