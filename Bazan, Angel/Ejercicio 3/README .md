# Ejercicio 3 - Diagrama Entidad Relación (DER)

```mermaid
erDiagram
    MATERIAS ||--o{ CALIFICACIONES : "posee"
    MATERIAS {
        int id PK
        string nombre UK
    }
    CALIFICACIONES {
        int id PK
        string alumno
        int materia_id FK
        decimal nota_1
        decimal nota_2
        decimal nota_3
        timestamp created_at
    }