# LC Representações - Sistema de Gestão

Sistema de gestão para LC Representações com autenticação, clientes e pedidos.

## Login

- **Usuário:** lidiane
- **Senha:** 123456

## Deploy no Vercel

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente em **Settings → Environment Variables**:

### Banco de dados (MySQL)
| Variável | Descrição |
|----------|-----------|
| `DB_HOST` | Host do MySQL (ex: seu-host.sql.planetscale.com) |
| `DB_USER` | Usuário do banco |
| `DB_PASSWORD` | Senha do banco |
| `DB_NAME` | Nome do banco (ex: lc_representacoes) |

### E-mail (opcional - para notificações de novos pedidos)
| Variável | Descrição |
|----------|-----------|
| `EMAIL_USER` | E-mail SMTP (ex: seu@email.com) |
| `EMAIL_PASS` | Senha do e-mail |
| `EMAIL_TO` | E-mail destino (padrão: lcrepresentacoeslidiane@gmail.com) |

3. Crie o banco e as tabelas executando o arquivo `schema.sql` no seu MySQL

## Estrutura

- **Login** (`index.html`) - Tela de autenticação com credenciais
- **Painel** (`painel.html`) - Dashboard com acesso a Clientes e Pedidos
- **Clientes** (`painel-clientes.html`) - CRUD de clientes
- **Pedidos** (`pedidos.html`) - CRUD de pedidos com notificação por e-mail

## Cores da marca

- Azul Médio: `#0065B3`
- Verde Médio: `#4CAB3F`
- Cinza Chumbo: `#2F2F2F`
