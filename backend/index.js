import mysql from 'mysql2/promise';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.PASSWORD,
    // database: "",
});

console.log('MySQL connected successfully!');