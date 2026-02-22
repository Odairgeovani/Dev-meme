# Meme por Gestos

Aplicação web que usa a webcam para mostrar memes conforme seus gestos:

- **Cara séria/brava** → mostra o meme 1
- **Sorriso** → mostra o meme 2
- **Mão na frente da boca** → mostra o meme 3

Enquanto você está sem expressão, só a câmera fica ligada com um quadrado branco futurista em volta do rosto.

## Como rodar

A página precisa ser servida por um servidor (por segurança o navegador exige isso para câmera e para carregar o MediaPipe).

Na pasta do projeto, você pode usar por exemplo:

```bash
python3 -m http.server 8080
```

Depois abra no navegador: `http://localhost:8080/`.

## Como usar

1. Clique em **Iniciar câmera** e permita o uso da webcam.
2. Abaixo da câmera, escolha:
   - Imagem para **cara séria** (meme 1).
   - Imagem para **sorriso** (meme 2).
   - Imagem para **mão na boca** (meme 3).
3. Volte para a área da câmera e faça:
   - Uma **cara séria/brava** → aparece o meme 1.
   - Um **sorriso bem evidente** → aparece o meme 2.
   - Coloque a **mão na frente da boca** → aparece o meme 3.
4. Sem expressão ou fora dos gestos → nenhuma imagem aparece, só o vídeo com o quadrado branco no rosto.

## Tecnologias

- **MediaPipe Tasks Vision**:
  - Face Landmarker (landmarks + blendshapes) para detectar rosto, sorriso e cara séria.
  - Hand Landmarker para detectar a mão e checar proximidade da boca.
- Canvas HTML (`<canvas>`) para desenhar o quadrado branco em volta do rosto.

## Observações

- A primeira vez pode demorar um pouco enquanto os modelos são baixados.
- Use boa iluminação para a detecção funcionar melhor.
- Funciona melhor em Chrome/Edge (navegadores com suporte completo ao MediaPipe).
