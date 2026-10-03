const express = require('express');
const mysql = require('mysql2/promise');
const { body, param, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Configuración del pool de conexión a MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'tp2_rectangulos',
    waitForConnections: true,
    connectionLimit: 10
});


const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            status: 'error',
            message: 'Errores de validación en la solicitud',
            errors: errors.array() 
        });
    }
    next();
};

const rejectCalculatedFields = (req, res, next) => {
    if (req.body.perimetro !== undefined || req.body.superficie !== undefined) {
        return res.status(400).json({
            status: 'error',
            message: 'No está permitido enviar los campos "perimetro" o "superficie". Son calculados automáticamente en el servidor.'
        });
    }
    next();
};


const validateLados = [
    rejectCalculatedFields,
    body('lado_a')
        .exists().withMessage('El campo lado_a es obligatorio')
        .isFloat({ gt: 0 }).withMessage('lado_a debe ser un número estrictamente mayor que cero'),
    body('lado_b')
        .exists().withMessage('El campo lado_b es obligatorio')
        .isFloat({ gt: 0 }).withMessage('lado_b debe ser un número strictly mayor que cero'),
    handleValidationErrors
];

// 
const validateId = [
    param('id')
        .isInt({ gt: 0 }).withMessage('El ID debe ser un número entero positivo'),
    handleValidationErrors
];



// 1. GET /api/rectangulos - Listar todos los rectángulos
app.get('/api/rectangulos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM rectangulos');
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// 2. GET /api/rectangulos/:id 
app.get('/api/rectangulos/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM rectangulos WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Rectángulo no encontrado' });
        }
        
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

//  Crear un rectángulo
app.post('/api/rectangulos', validateLados, async (req, res) => {
    try {
        const lado_a = parseFloat(req.body.lado_a);
        const lado_b = parseFloat(req.body.lado_b);

        // Cálculo obligatorio en el servidor
        const perimetro = 2 * (lado_a + lado_b);
        const superficie = lado_a * lado_b;

        const [result] = await pool.query(
            'INSERT INTO rectangulos (lado_a, lado_b, perimetro, superficie) VALUES (?, ?, ?, ?)',
            [lado_a, lado_b, perimetro, superficie]
        );

        res.status(201).json({
            status: 'success',
            message: 'Rectángulo creado exitosamente',
            data: {
                id: result.insertId,
                lado_a,
                lado_b,
                perimetro,
                superficie
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


app.put('/api/rectangulos/:id', [...validateId, ...validateLados], async (req, res) => {
    try {
        const { id } = req.params;
        const lado_a = parseFloat(req.body.lado_a);
        const lado_b = parseFloat(req.body.lado_b);

        r
        const perimetro = 2 * (lado_a + lado_b);
        const superficie = lado_a * lado_b;

        const [result] = await pool.query(
            'UPDATE rectangulos SET lado_a = ?, lado_b = ?, perimetro = ?, superficie = ? WHERE id = ?',
            [lado_a, lado_b, perimetro, superficie, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Rectángulo no encontrado para actualizar' });
        }

        res.json({
            status: 'success',
            message: 'Rectángulo actualizado exitosamente',
            data: { id: parseInt(id), lado_a, lado_b, perimetro, superficie }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


app.delete('/api/rectangulos/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM rectangulos WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Rectángulo no encontrado' });
        }

        res.json({ status: 'success', message: 'Rectángulo eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor de Ejercicio 1 corriendo en http://localhost:${PORT}`);
});