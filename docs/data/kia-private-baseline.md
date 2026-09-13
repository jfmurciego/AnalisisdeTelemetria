# Línea base privada de telemetría Kia

## Propósito

Este documento conserva evidencia agregada suficiente para diseñar y auditar el contrato de ingesta sin publicar los CSV reales, sus nombres, horarios ni recorridos. La fuente permanece fuera de Git.

## Identificación de la fuente

- Identificador interno: `kia-private-baseline-2026-09-a`.
- Huella SHA-256 del paquete privado: `817e2a4fcc07dd028150d968a99e08f2a4042643f1b047d9d99e32a3a6575ca2`.
- Fecha de perfilado: 2026-09-13.
- Perfilador: lectura secuencial del ZIP, contrato `SECONDS;PID;VALUE;UNITS`.
- Datos publicados en Git: solo agregados no geográficos y fixtures sintéticos.

## Inventario agregado

| Métrica | Resultado |
|---|---:|
| Sesiones | 7 |
| Filas | 2.581.519 |
| PIDs distintos | 50 |
| PIDs presentes en las siete sesiones | 26 |
| Filas sin PID o con tiempo/valor no numérico | 0 |
| Sesiones con al menos una pausa superior a 3 s | 3 |
| Sesiones con una pausa superior a 30 s | 2 |
| Mayor pausa observada | 3.327,20 s |
| Columnas GPS | 0 |

Los tiempos son monotónicos dentro de cada fichero. Una sesión abierta durante una pausa no equivale a conducción continua; toda integración debe excluir intervalos superiores al máximo configurado.

## Cobertura de capacidades

| Capacidad | Evidencia | Estado |
|---|---|---|
| Velocidad | `Vehicle speed` en 7/7 sesiones | Disponible |
| Régimen del motor | `Engine RPM` en 7/7 sesiones | Disponible |
| Gasolina acumulada | `Fuel used` en 7/7 sesiones | Disponible |
| Caudal de gasolina | `Engine fuel rate` en 7/7 sesiones | Disponible |
| Temperatura de refrigerante | Presente en 4/7 sesiones | Parcial |
| Energía eléctrica HV | Una lectura de voltaje y una de corriente en todo el paquete | Insuficiente |
| Regeneración | Sin serie continua de corriente HV | Insuficiente |
| Ruta GPS | No existen columnas de coordenadas | Insuficiente |

## Señales que no deben tomarse como medición primaria

- Los promedios de consumo de Car Scanner alcanzan valores iniciales de hasta 104.579 L/100 km por distancia próxima a cero.
- `Distance to empty` aparece de forma esporádica entre 1.448,4 y 1.462,4 km y no se acepta como autonomía física.
- `Fuel used price` usa la configuración monetaria de la aplicación. El coste real debe combinar consumo validado con precio documentado de repostaje o recarga.
- Los acumulados `Today`, `Week` y `total` atraviesan límites distintos de la sesión. No sustituyen al acumulado propio del recorrido.

## Consecuencia arquitectónica

El importador conserva primero el registro largo original. Después genera inventario y determina capacidades. Una métrica solo se habilita cuando sus señales mínimas tienen cobertura suficiente; la ausencia de datos nunca se convierte en cero.
