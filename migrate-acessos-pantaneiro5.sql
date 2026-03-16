-- Execute este SQL no seu banco MySQL para criar a tabela de acessos
USE lc_representacoes;

CREATE TABLE IF NOT EXISTS acessos_pantaneiro5 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo ENUM('cnpj','usuario') NOT NULL,
  valor VARCHAR(255) NOT NULL,
  UNIQUE KEY uk_tipo_valor (tipo, valor)
);
