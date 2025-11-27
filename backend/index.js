import mysql from 'mysql2/promise';
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: process.env.PASSWORD,
    database: process.env.DATABASE,
});

console.log('MySQL connected successfully!');

// await db.execute(`create database xeno`);

// console.log(await db.execute("show databases"));