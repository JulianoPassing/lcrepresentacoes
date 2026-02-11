-- ============================================================
-- MIGRAÇÃO: Atualizar tabelas e copiar clientes do g8sistema
-- Execute na VPS: mysql -u julianopassing -p < migrate-copy-clientes.sql
-- ============================================================

USE lc_representacoes;

-- 1. Remover tabela clientes antiga (estrutura simples com nome/email/telefone)
DROP TABLE IF EXISTS clientes;

-- 2. Criar tabela clientes com mesma estrutura do g8sistema
CREATE TABLE clientes (
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

-- 3. Copiar todos os clientes do banco sistemajuliano para lc_representacoes
INSERT INTO lc_representacoes.clientes (razao, cnpj, ie, endereco, bairro, cidade, estado, cep, email, telefone, transporte, prazo, obs)
SELECT razao, cnpj, ie, endereco, bairro, cidade, estado, cep, email, telefone, transporte, prazo, obs
FROM sistemajuliano.clientes;

-- 4. Mostrar quantos clientes foram copiados
SELECT COUNT(*) AS 'Clientes copiados' FROM lc_representacoes.clientes;
