# Senda-IaMalaga2026

**Asistente de diagnóstico industrial avanzado para la preservación del conocimiento experto.**

Senda es un asistente de diagnóstico industrial por voz diseñado para capturar, preservar y democratizar el conocimiento de los operarios mecánicos veteranos antes de su jubilación. Utilizando modelos de Inteligencia Artificial de código abierto y herramientas Low-Code, Senda rompe las barreras del idioma y la accesibilidad en la planta de producción.

---

## El Problema y el Impacto Social

En la industria actual se están perdiendo décadas de experiencia técnica debido a la jubilación de los operarios más experimentados. Además, las plantas industriales cuentan con plantillas multiculturales que se enfrentan a barreras idiomáticas, y entornos donde la manipulación de maquinaria pesada con guantes dificulta el uso de interfaces táctiles tradicionales.

Senda aborda estos retos mediante:

1. Preservación del Conocimiento: Almacenamiento estructurado de los procedimientos técnicos de los operarios veteranos.
2. Inclusión y Accesibilidad: Interfaz accionada por voz que soporta múltiples idiomas y traduce en tiempo real para el operario.
3. Sostenibilidad: Diagnósticos precisos que reducen el desecho de componentes y minimizan el impacto ambiental al evitar desplazamientos innecesarios.

---

## Arquitectura Tecnológica

El proyecto se basa en una arquitectura ágil y eficiente:

* Frontend: Desarrollado en Lovable con interfaces adaptadas a entornos industriales, priorizando la claridad y el uso sencillo.
* Base de Datos: Supabase (PostgreSQL) para la gestión relacional del inventario y la base de conocimiento experto.
* Procesamiento de Voz e IA: Integración de modelos LLM abiertos para la normalización lingüística, análisis de síntomas multilingüe y mapeo semántico de soluciones.

### Modelo de Datos (Supabase)

* expert_knowledge: Registro de averías, síntomas técnicos y soluciones recomendadas.
* inventory_items: Catálogo y control de stock físico de repuestos (SKU, ubicaciones).
* knowledge_inventory: Tabla relacional que asocia averías con las piezas necesarias para su reparación.

---

## Instalación y Despliegue Local

Al ser una aplicación web modular:

1. Conecta el proyecto de Lovable con el repositorio.
2. Configura las variables de entorno para enlazar la instancia de Supabase (SUPABASE_URL y SUPABASE_ANON_KEY).
3. Ejecuta el archivo de migración de base de datos disponible en la carpeta /supabase.

---


### Hoja de Ruta (Roadmap)

* **Fase 1 (Actual):** Prototipado funcional, validación de la interfaz de voz y estructuración de la base de conocimiento en Supabase.
* **Fase 2:** Optimización del modelo de IA para entornos de alta contaminación acústica (reducción de ruido industrial).
* **Fase 3:** Implementación de analítica predictiva para el mantenimiento industrial basada en el histórico de diagnósticos.
  
---

## Licencia

Este proyecto se distribuye bajo la licencia MIT. Se basa en el compromiso con la IA abierta y responsable para asegurar que el conocimiento industrial sea un bien accesible para las futuras generaciones de trabajadores.
