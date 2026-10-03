# Ejercicio 2 - Diagrama Entidad Relación (DER)

```mermaid
erDiagram
    TAREAS {
        int id PK
        string nombre UK
        string estado
        timestamp created_at
    }