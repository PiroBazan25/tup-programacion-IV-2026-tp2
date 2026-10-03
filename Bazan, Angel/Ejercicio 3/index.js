const express = require('express');
const mysql = require('mysql2/promise');
const { body, param, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

// Pool de conexión a MySQL
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'tp2_ejercicio3',
    waitForConnections: true,
    connectionLimit: 10
});

// Middleware para manejo de errores de validación
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

// Validaciones para Contactos
const validateContacto = [
    body('nombre')
        .exists().withMessage('El campo nombre es obligatorio')
        .trim().notEmpty().withMessage('El nombre no puede estar vacío')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres'),
    body('email')
        .exists().withMessage('El campo email es obligatorio')
        .isEmail().withMessage('Debe ser una dirección de email válida')
        .normalizeEmail(),
    body('telefono')
        .exists().withMessage('El campo teléfono es obligatorio')
        .trim().notEmpty().withMessage('El teléfono no puede estar vacío'),
    body('empresa')
        .optional()
        .trim(),
    handleValidationErrors
];

const validateId = [
    param('id').isInt({ gt: 0 }).withMessage('El ID debe ser un número entero positivo'),
    handleValidationErrors
];

// --- RUTAS API ---

// GET /api/contactos - Listar todos
app.get('/api/contactos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM contactos');
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET /api/contactos/:id - Obtener por ID
app.get('/api/contactos/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM contactos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Contacto no encontrado' });
        }
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/contactos - Crear contacto
app.post('/api/contactos', validateContacto, async (req, res) => {
    try {
        const { nombre, email, telefono, empresa } = req.body;
        const [result] = await pool.query(
            'INSERT INTO contactos (nombre, email, telefono, empresa) VALUES (?, ?, ?, ?)',
            [nombre, email, telefono, empresa || null]
        );
        res.status(201).json({
            status: 'success',
            message: 'Contacto creado exitosamente',
            data: { id: result.insertId, nombre, email, telefono, empresa }
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ status: 'error', message: 'El email ingresado ya existe' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT /api/contactos/:id - Actualizar contacto
app.put('/api/contactos/:id', [...validateId, ...validateContacto], async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, empresa } = req.body;
        const [result] = await pool.query(
            'UPDATE contactos SET nombre = ?, email = ?, telefono = ?, empresa = ? WHERE id = ?',
            [nombre, email, telefono, empresa || null, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Contacto no encontrado' });
        }
        res.json({
            status: 'success',
            message: 'Contacto actualizado exitosamente',
            data: { id: parseInt(id), nombre, email, telefono, empresa }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/contactos/:id - Eliminar contacto
app.delete('/api/contactos/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM contactos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Contacto no encontrado' });
        }
        res.json({ status: 'success', message: 'Contacto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = 3002;
app.listen(PORT, () => {
    console.log(`Servidor de Ejercicio 3 corriendo en http://localhost:${PORT}`);
});