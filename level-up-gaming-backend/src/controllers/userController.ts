// level-up-gaming-backend/src/controllers/userController.ts

import { type Request, type Response } from 'express';
import { type User } from '../data/userData';
import { v4 as uuidv4 } from 'uuid';
import { readFromDb, writeToDb } from '../utils/dbUtils';
import bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || 'dev-secret';
const SALT_ROUNDS = 10;

// --- FUNCIONES AUXILIARES ---
const generateReferralCode = (name: string) => {
    const namePrefix = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `${namePrefix}${randomSuffix}`;
};

// ----------------------------------------------------
// LÓGICA DE AUTENTICACIÓN
// ----------------------------------------------------
const authUser = async (req: Request, res: Response) => {
    const { loginIdentifier, password } = req.body;
    const users = readFromDb<User>('users');
    const user = users.find(
        u => u.email === loginIdentifier || u.name === loginIdentifier
    );

    if (!user) {
        return res.status(401).json({ message: 'Credenciales inválidas o usuario no encontrado.' });
    }

    if (!user.isActive) {
        return res.status(403).json({ message: 'Su cuenta ha sido desactivada. Contacte a soporte.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ message: 'Credenciales inválidas o usuario no encontrado.' });
    }

    // Issue JWT
    const token = jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '1h' });

    // Return user info without password and with token
    const safeUser = { ...user } as any;
    delete safeUser.password;
    safeUser.token = token;

    res.json(safeUser);
};

// ----------------------------------------------------
// LÓGICA DE REGISTRO DE CLIENTE
// ----------------------------------------------------
const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, rut, age, address, referredBy } = req.body;
    const users = readFromDb<User>('users');

    if (users.some(u => u.email === email)) {
        return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    const hasDuocDiscount = email.toLowerCase().endsWith('@duoc.cl') || email.toLowerCase().endsWith('@duocuc.cl');
    
    let startingPoints = 100;
    const referralCode = generateReferralCode(name);

    if (referredBy) {
        const referringUserIndex = users.findIndex(u => u.referralCode === referredBy);
        if (referringUserIndex !== -1) {
            startingPoints += 50;
            users[referringUserIndex].points += 50;
        }
    }

    if (!address || !address.street || !address.city || !address.region) {
        return res.status(400).json({ message: 'Faltan datos de dirección para el registro.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser: User = {
        id: uuidv4(), name, email, password: hashed, 
        rut, age: parseInt(age), role: 'customer', token: '',
        hasDuocDiscount, points: startingPoints, referralCode,
        address, 
        isActive: true,
    };

    // issue JWT for the created user
    const token = jwt.sign({ sub: newUser.id, role: newUser.role }, SECRET, { expiresIn: '1h' });
    newUser.token = token;

    users.push(newUser);
    writeToDb<User>('users', users);

    const safeUser = { ...newUser } as any;
    delete safeUser.password;
    res.status(201).json(safeUser);
};

// ----------------------------------------------------
// LÓGICA DE EDICIÓN DE PERFIL DEL CLIENTE
// ----------------------------------------------------
const updateUserProfile = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { name, age, address, newPassword } = req.body;
    const users = readFromDb<User>('users');
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        const user = users[userIndex];
        let updatedPassword = user.password;
        if (newPassword && newPassword.length >= 6) {
            updatedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        }

        users[userIndex] = {
            ...user,
            name: name || user.name,
            age: parseInt(age) || user.age,
            address: address || user.address,
            password: updatedPassword,
        };
        
        writeToDb<User>('users', users);
        const updatedUser = users[userIndex];

        res.json({
            id: updatedUser.id, name: updatedUser.name, email: updatedUser.email,
            rut: updatedUser.rut, age: updatedUser.age, role: updatedUser.role,
            token: updatedUser.token, hasDuocDiscount: updatedUser.hasDuocDiscount,
            points: updatedUser.points, referralCode: updatedUser.referralCode,
            address: updatedUser.address, isActive: updatedUser.isActive,
        });
        return;
    }

    res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
};

// ----------------------------------------------------
// LÓGICA DE ADMINISTRACIÓN: OBTENER, CREAR Y EDITAR
// ----------------------------------------------------
const getUsers = (req: Request, res: Response) => {
    const users = readFromDb<User>('users');
    res.json(users);
};

const createUser = async (req: Request, res: Response) => {
    const { name, email, password, role, rut, age, address } = req.body;
    const users = readFromDb<User>('users');

    if (users.some(u => u.email === email)) {
        return res.status(400).json({ message: 'El correo ya está registrado.' });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser: User = {
        id: uuidv4(), name, email, password: hashed, 
        rut: rut || 'NO ASIGNADO', age: parseInt(age) || 0, 
        role: role, token: '',
        hasDuocDiscount: email.toLowerCase().endsWith('@duoc.cl') || email.toLowerCase().endsWith('@duocuc.cl'), 
        points: 0, referralCode: generateReferralCode(name), 
        address: address || { street: 'N/A', city: 'N/A', region: 'N/A', zipCode: 'N/A' }, 
        isActive: true,
    };

    // issue JWT for the created user
    const token = jwt.sign({ sub: newUser.id, role: newUser.role }, SECRET, { expiresIn: '1h' });
    newUser.token = token;

    users.push(newUser);
    writeToDb<User>('users', users);
    const safeUser = { ...newUser } as any;
    delete safeUser.password;
    res.status(201).json(safeUser);
};

const updateUserByAdmin = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, rut, age, address, newPassword } = req.body;
    const users = readFromDb<User>('users');
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex !== -1) {
        if (id === 'u1' && role !== users[userIndex].role) {
            return res.status(403).json({ message: 'No se puede cambiar el rol del administrador principal.' });
        }
        

        let updatedPassword = users[userIndex].password;
        if (newPassword && newPassword.length >= 6) {
            updatedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        }

        users[userIndex] = {
            ...users[userIndex],
            name: name || users[userIndex].name,
            email: email || users[userIndex].email,
            role: role || users[userIndex].role,
            rut: rut || users[userIndex].rut,
            age: parseInt(age) || users[userIndex].age,
            address: address || users[userIndex].address,
            password: updatedPassword,
        };

        writeToDb<User>('users', users);
        res.json(users[userIndex]);
        return;
    }

    res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
};

// ----------------------------------------------------
// FUNCIÓN DE PUNTOS Y TOGGLE DE ESTADO
// ----------------------------------------------------
const updatePoints = (req: Request, res: Response) => {
    const { id } = req.params;
    const { pointsToAdd } = req.body;
    const users = readFromDb<User>('users');
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex !== -1 && pointsToAdd !== 0) {
        const currentPoints = users[userIndex].points;
        const newBalance = currentPoints + pointsToAdd;

        if (newBalance < 0) {
            return res.status(400).json({ message: 'Puntos insuficientes para realizar la operación.' });
        }
        
        users[userIndex].points = newBalance;
        writeToDb<User>('users', users);
        res.json(users[userIndex]);
        return;
    }

    res.status(404).json({ message: 'Usuario no encontrado o cambio de puntos inválido.' });
};

const toggleUserStatus = (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const users = readFromDb<User>('users');
    const userIndex = users.findIndex(u => u.id === id);

    if (userIndex !== -1) {
        if (id === 'u1') {
            return res.status(403).json({ message: 'No se puede desactivar al administrador principal.' });
        }
        
        users[userIndex].isActive = isActive;
        writeToDb<User>('users', users);
        res.json(users[userIndex]);
        return;
    }
    res.status(404).json({ message: 'Usuario no encontrado.' });
};

export { authUser, registerUser, updateUserProfile, getUsers, createUser, updateUserByAdmin, updatePoints, toggleUserStatus };