require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const { body, param, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: 'tp2_ejercicio3',
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

// GET /api/materias
app.get('/api/materias', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM materias');
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// GET /api/calificaciones
app.get('/api/calificaciones', async (req, res) => {
    try {
        const sql = `
            SELECT c.id, c.alumno, m.nombre AS materia, c.nota_1, c.nota_2, c.nota_3,
                   ROUND((c.nota_1 + c.nota_2 + c.nota_3) / 3, 2) AS promedio
            FROM calificaciones c
            JOIN materias m ON c.materia_id = m.id
        `;
        const [rows] = await db.execute(sql);
        res.json({ status: 'success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// POST /api/calificaciones
app.post('/api/calificaciones', [
    body('alumno').trim().notEmpty().withMessage('El nombre del alumno es obligatorio'),
    body('materia_id').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    body('nota_1').isFloat({ min: 1, max: 10 }).withMessage('La nota 1 debe estar entre 1 y 10'),
    body('nota_2').isFloat({ min: 1, max: 10 }).withMessage('La nota 2 debe estar entre 1 y 10'),
    body('nota_3').isFloat({ min: 1, max: 10 }).withMessage('La nota 3 debe estar entre 1 y 10'),
    validarCampos
], async (req, res) => {
    try {
        const { alumno, materia_id, nota_1, nota_2, nota_3 } = req.body;

        // Verificar si la materia existe
        const [materia] = await db.execute('SELECT id FROM materias WHERE id = ?', [materia_id]);
        if (materia.length === 0) {
            return res.status(404).json({ status: 'error', message: 'La materia especificada no existe' });
        }

        // Verificar unicidad combinación Alumno-Materia
        const [existente] = await db.execute('SELECT id FROM calificaciones WHERE LOWER(alumno) = LOWER(?) AND materia_id = ?', [alumno, materia_id]);
        if (existente.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Ya existen calificaciones para este alumno en la materia seleccionada' });
        }

        const [result] = await db.execute(
            'INSERT INTO calificaciones (alumno, materia_id, nota_1, nota_2, nota_3) VALUES (?, ?, ?, ?, ?)',
            [alumno, materia_id, nota_1, nota_2, nota_3]
        );

        res.status(201).json({
            status: 'success',
            message: 'Calificación registrada exitosamente',
            data: { id: result.insertId, alumno, materia_id, nota_1, nota_2, nota_3 }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// PUT /api/calificaciones/:id
app.put('/api/calificaciones/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    body('alumno').trim().notEmpty().withMessage('El nombre del alumno es obligatorio'),
    body('materia_id').isInt({ min: 1 }).withMessage('ID de materia inválido'),
    body('nota_1').isFloat({ min: 1, max: 10 }).withMessage('La nota 1 debe estar entre 1 y 10'),
    body('nota_2').isFloat({ min: 1, max: 10 }).withMessage('La nota 2 debe estar entre 1 y 10'),
    body('nota_3').isFloat({ min: 1, max: 10 }).withMessage('La nota 3 debe estar entre 1 y 10'),
    validarCampos
], async (req, res) => {
    try {
        const { id } = req.params;
        const { alumno, materia_id, nota_1, nota_2, nota_3 } = req.body;

        const [calificacion] = await db.execute('SELECT * FROM calificaciones WHERE id = ?', [id]);
        if (calificacion.length === 0) return res.status(404).json({ status: 'error', message: 'Registro de calificación no encontrado' });

        const [materia] = await db.execute('SELECT id FROM materias WHERE id = ?', [materia_id]);
        if (materia.length === 0) return res.status(404).json({ status: 'error', message: 'La materia especificada no existe' });

        const [duplicado] = await db.execute('SELECT id FROM calificaciones WHERE LOWER(alumno) = LOWER(?) AND materia_id = ? AND id != ?', [alumno, materia_id, id]);
        if (duplicado.length > 0) return res.status(400).json({ status: 'error', message: 'Ya existe otro registro para este alumno y materia' });

        await db.execute(
            'UPDATE calificaciones SET alumno = ?, materia_id = ?, nota_1 = ?, nota_2 = ?, nota_3 = ? WHERE id = ?',
            [alumno, materia_id, nota_1, nota_2, nota_3, id]
        );

        res.json({ status: 'success', message: 'Calificación actualizada correctamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// DELETE /api/calificaciones/:id
app.delete('/api/calificaciones/:id', [
    param('id').isInt({ min: 1 }).withMessage('ID inválido'),
    validarCampos
], async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM calificaciones WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ status: 'error', message: 'Registro no encontrado' });
        res.json({ status: 'success', message: 'Registro eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`Ejercicio 3 corriendo en puerto ${PORT}`));