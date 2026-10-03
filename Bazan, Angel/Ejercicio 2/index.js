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
    database: 'tp2_ejercicio2',
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

// Validaciones para datos de producto
const validateProducto = [
    body('nombre')
        .exists().withMessage('El campo nombre es obligatorio')
        .trim().notEmpty().withMessage('El nombre no puede estar vacío')
        .isLength({ max: 100 }).withMessage('El nombre no puede exceder los 100 caracteres'),
    body('precio')
        .exists().withMessage('El campo precio es obligatorio')
        .isFloat({ gt: 0 }).withMessage('El precio debe ser un número mayor a 0'),
    body('stock')
        .exists().withMessage('El campo stock es obligatorio')
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0'),
    body('categoria')
        .exists().withMessage('El campo categoría es obligatorio')
        .trim().notEmpty().withMessage('La categoría no puede estar vacía'),
    handleValidationErrors
];

// Validación para el ID
const validateId = [
    param('id').isInt({ gt: 0 }).withMessage('El ID debe ser un número entero positivo'),
    handleValidationErrors
];


// GET /api/productos - Listar todos
app.get('/api/productos', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM productos');
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET /api/productos/:id - Obtener por ID
app.get('/api/productos/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/productos - Crear producto
app.post('/api/productos', validateProducto, async (req, res) => {
    try {
        const { nombre, precio, stock, categoria } = req.body;
        const [result] = await pool.query(
            'INSERT INTO productos (nombre, precio, stock, categoria) VALUES (?, ?, ?, ?)',
            [nombre, precio, stock, categoria]
        );
        res.status(201).json({
            status: 'success',
            message: 'Producto creado exitosamente',
            data: { id: result.insertId, nombre, precio, stock, categoria }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT /api/productos/:id 
app.put('/api/productos/:id', [...validateId, ...validateProducto], async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, precio, stock, categoria } = req.body;
        const [result] = await pool.query(
            'UPDATE productos SET nombre = ?, precio = ?, stock = ?, categoria = ? WHERE id = ?',
            [nombre, precio, stock, categoria, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado para actualizar' });
        }
        res.json({
            status: 'success',
            message: 'Producto actualizado exitosamente',
            data: { id: parseInt(id), nombre, precio, stock, categoria }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/productos/:id 
app.delete('/api/productos/:id', validateId, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM productos WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
        }
        res.json({ status: 'success', message: 'Producto eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`Servidor de Ejercicio 2 corriendo en http://localhost:${PORT}`);
});