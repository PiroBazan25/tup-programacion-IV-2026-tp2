

# Ejercicio 2 - Diagrama de Entidad (DER)

```mermaid
erDiagram
    PRODUCTOS {
        int id PK
        string nombre
        decimal precio
        int stock
        string categoria
        timestamp created_at
    }