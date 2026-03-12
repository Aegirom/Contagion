import express from "express";

export const getAllSubmissions = (req, res) => {
  //logic to fetch data from db
  res.json([{ id: 1, name: "Example submission" }]);
}
