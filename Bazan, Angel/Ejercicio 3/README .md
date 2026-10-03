# Ejercicio 3 - Diagrama de Entidad (DER)

```mermaid
erDiagram
    CONTACTOS {
        int id PK
        string nombre
        string email
        string telefono
        string empresa
        timestamp created_at
    }