// Realiza o require do express, http, e socketio
const express = require('express');
const app = express();
// passa o express para o http-server
const http = require('http').createServer(app);
// passa o http-server par ao socketio
const io = require('socket.io')(http);

const redis = require('redis');
const redisConfig = require('./config/redis');

//Monitoramento das filas
const BullBoard = require('bull-board');
//Fila
const Queue = require('./lib/Queue');

//env
require('dotenv').config();

// Função para obter o contador de senhas do Redis
const getPasswordCount = async (clientRedis) => {
  const count = await clientRedis.get('passwordCount');
  return count ? parseInt(count) : 0;
}; 

// Função para incrementar o contador de senhas
const incrementPasswordCount = async (clientRedis) => {
  const currentCount = await getPasswordCount(clientRedis);
  const newCount = currentCount + 1;
  await clientRedis.set('passwordCount', newCount);
  return newCount;
}; 



// Evento de WebSocket
io.on('connection', async (socket) => {
  

  const clientRedis = await redis.createClient(redisConfig)
    .on('error', err => console.log('Redis Client Error', err))
    .connect();
 
  // entrada na fila
  socket.on('fila', async(data) => {
    const jsonObject = JSON.parse(data);
    const {token} = jsonObject
    const exist = await clientRedis.exists(token);

    if(exist != 1){//não existe 
      var senha = await incrementPasswordCount(clientRedis);
      await clientRedis.set(token+'_posicao', senha);
      await clientRedis.rPush('filaTokens', token);
    }else{
      var senha = await clientRedis.get(token+'_posicao');
    }

    Queue.add('key_ticket',{token,senha})
    Queue.add('key_notification',{token})

    console.log('token',token, senha)
    
    io.emit(`fila_${token}`, `Sua posição é ${senha}° na fila de espera`);

  });

  socket.on('start', async(data) => {
    const allTokens = await clientRedis.lRange('filaTokens', 0, -1);
    console.log(allTokens)
    allTokens.map((item,index)=>{
      setTimeout(() => {
          io.emit(`fila`, `A posição atual é ${index+1}°`);
      }, `${index}0000`); // 2000 milissegundos = 2 segundos
    })
  })


  // Quando o cliente se desconecta
  socket.on('disconnect', async () => {
    console.log('\nCliente desconectado');
    await clientRedis.disconnect();
  });
});

// Middleware para JSON
app.use(express.json());

//Setando todas as filas
//BullBoard.setQueues(Queue.queues.map(queue => queue.bull));
//Rota monitoramento
//app.use('/bull', BullBoard.UI); 

// Rota básica HTTP para teste
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando!' });
});

  

// Inicia o servidor na porta 3000
const PORT = 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
