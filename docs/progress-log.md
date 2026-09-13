# Registro de progreso

## 2026-09-14 — Módulo 2: reconstrucción temporal

- Implementada alineación causal: cada valor conserva instante original y antigüedad.
- Fijada rejilla de un segundo, caducidad de dos segundos y excepción de cinco segundos para SOC.
- Separadas dos sesiones reales que contenían huecos de 2.208,916 y 3.327,195 segundos.
- Prohibida la integración a través de huecos superiores a tres segundos.
- Detectada en una sesión la oscilación de los acumuladores de distancia y gasolina.
- Sustituida la suma de incrementos positivos por diferencia entre extremos y reconciliación independiente.
- Reproducidos los totales privados: 103,51 km y 5,651 L en ocho segmentos con movimiento; existe además un segmento continuo de 10,6 segundos sin distancia.
- Confirmado 5,775 L/100 km en el recorrido largo de 70,30 km.
- Mantenida la energía HV como insuficiente por falta de cobertura continua en este paquete.
- Añadidas pruebas sintéticas y vista web por segmento. Ninguna fila real entra en Git.

## 2026-09-13 — Módulo 1: inventario e ingesta Kia

- Perfiladas localmente siete sesiones privadas: 2.581.519 filas y 50 PIDs distintos.
- Confirmado el contrato largo `SECONDS;PID;VALUE;UNITS` sin coordenadas GPS.
- Identificadas pausas de sesión superiores a 30 minutos que deben excluirse de integraciones.
- Confirmada cobertura continua de gasolina, velocidad y RPM.
- Bloqueados electricidad y regeneración: solo existe una lectura de voltaje y corriente HV.
- Añadido catálogo PID versionado, inventario de sesión y puertas de capacidad.
- Añadidas pruebas exclusivamente sintéticas. Ninguna telemetría real entra en Git.

## 2026-09-11 — Inicio profesional del repositorio

- Confirmado repositorio privado vacío.
- Definida arquitectura modular y contrato de datos.
- Implantada barrera de privacidad para telemetría y GPS.
- Creada primera aplicación local de carga y control de calidad.
- Añadidas fórmulas versionadas, pruebas sintéticas, ADR y CI.
- Próximo hito: alinear telemetría validada con fuentes de vía, clima y tráfico.

## 2026-09-11 — Corrección del quality gate

- Eliminada la segunda declaración de versión de pnpm en GitHub Actions.
- `package.json` queda como fuente única para la versión del gestor de paquetes.
- Sin cambios en las fórmulas ni en el comportamiento analítico.
