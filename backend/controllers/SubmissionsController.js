import pool from '../config/db.js'
import express from "express";

async function fetchSubmissions(userId) {
  try{
    const result = await pool.query`SELECT * FROM Analysis_Submissions`;
    return result.recordset;
  }
  catch(err){
    console.log("Failed to fetch Submissions: ", err);
    return 0;
  }
}

export const getAllSubmissions = async (req, res) => {
  try{
  const userId = 0;  
  const data = await fetchSubmissions(userId);
  console.log(data);
  res.json([{ id: 1, name: "Example submission" }]);
  }
  catch (err) {
    console.log("Failed to get Submissions: ", err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
