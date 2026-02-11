-- LC Representações - Schema do banco de dados (mesma estrutura do g8sistema)
-- Execute este script no MySQL antes de configurar as variáveis de ambiente no Vercel

CREATE DATABASE IF NOT EXISTS lc_representacoes;
USE lc_representacoes;

CREATE TABLE IF NOT EXISTS clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  razao VARCHAR(255) NOT NULL,
  cnpj VARCHAR(20),
  ie VARCHAR(50),
  endereco TEXT,
  bairro VARCHAR(100),
  cidade VARCHAR(100),
  estado VARCHAR(50),
  cep VARCHAR(20),
  email VARCHAR(255),
  telefone VARCHAR(50),
  transporte VARCHAR(255),
  prazo VARCHAR(100),
  obs TEXT
);

CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa VARCHAR(255),
  descricao TEXT,
  dados TEXT,
  data_pedido DATETIME DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
