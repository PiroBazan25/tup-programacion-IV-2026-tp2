require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { body, param, query, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: 'tp2_ejercicio2',
    waitForConnections: true,
    connectionLimit: 10
});

const validarCampos = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({ status: 'error', errores: errores.array() });
    }
    next();
};

// GET /api/tareas (con filtro por estado opcional)
app.get('/api/tareas', [
    query('estado').optional().isIn(['pendiente', 'completada']).withMessage('El estado debe ser pendiente o completada'),
    validarCampos
], async (req, res) => {
    try {
        const { estado } = req.query;
        let sql = 'SELECT * FROM tareas';
        const params = [];

        if (estado) {
            sql += ' WHERE estado = ?';
            params.push(estado);
        }

        const [rows] = await db.execute(sql, params);
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET /api/tareas/:id
app.get('/api/tareas/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    validarCampos
], async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM tareas WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
        res.json({ status: 'success', data: rows[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/tareas
app.post('/api/tareas', [
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ max: 150 }).withMessage('El nombre no debe superar 150 caracteres'),
    body('estado').optional().isIn(['pendiente', 'completada']).withMessage('Estado inválido'),
    validarCampos
], async (req, res) => {
    try {
        const { nombre, estado = 'pendiente' } = req.body;
        
        // Unicidad case-insensitive
        const [existentes] = await db.execute('SELECT id FROM tareas WHERE LOWER(nombre) = LOWER(?)', [nombre]);
        if (existentes.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Ya existe una tarea con ese nombre' });
        }

        const [result] = await db.execute('INSERT INTO tareas (nombre, estado) VALUES (?, ?)', [nombre, estado]);
        res.status(201).json({
            status: 'success',
            message: 'Tarea creada exitosamente',
            data: { id: result.insertId, nombre, estado }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT /api/tareas/:id
app.put('/api/tareas/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio')
        .isLength({ max: 150 }).withMessage('El nombre no debe superar 150 caracteres'),
    body('estado').isIn(['pendiente', 'completada']).withMessage('El estado es obligatorio y debe ser pendiente o completada'),
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, estado } = req.body;

        const [tarea] = await db.execute('SELECT * FROM tareas WHERE id = ?', [id]);
        if (tarea.length === 0) return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });

        const [duplicados] = await db.execute('SELECT id FROM tareas WHERE LOWER(nombre) = LOWER(?) AND id != ?', [nombre, id]);
        if (duplicados.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Ya existe otra tarea con ese nombre' });
        }

        await db.execute('UPDATE tareas SET nombre = ?, estado = ? WHERE id = ?', [nombre, estado, id]);
        res.json({ status: 'success', message: 'Tarea actualizada', data: { id: Number(id), nombre, estado } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/tareas/:id
app.delete('/api/tareas/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    validarCampos
], async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM tareas WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Tarea no encontrada' });
        res.json({ status: 'success', message: 'Tarea eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Ejercicio 2 corriendo en puerto ${PORT}`));