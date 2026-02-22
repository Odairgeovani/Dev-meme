# Meme por Gestos

Aplicação web que usa a webcam para mostrar imagens conforme seus gestos:

- **Cara séria** → mostra a primeira imagem que você escolher (ex.: um meme)
- **Mão na frente da boca** → mostra a segunda imagem que você escolher

## Como rodar

A página precisa ser servida por um servidor (por segurança o navegador exige isso para câmera e para carregar o MediaPipe).

Na pasta do projeto:

```bash
npx serve .
```

Depois abra no navegador o endereço que aparecer (ex.: `http://localhost:3000`).

## Como usar

1. Escolha a **imagem para cara séria** (primeiro campo).
2. Escolha a **imagem para mão na boca** (segundo campo).
3. Clique em **Iniciar câmera** e permita o uso da webcam.
4. Faça uma **cara séria** para ver a primeira imagem.
5. Coloque a **mão na frente da boca** para ver a segunda imagem.

## Tecnologias

- **MediaPipe Tasks Vision** (Face Landmarker + Hand Landmarker) para detecção de rosto e mãos.
- **Face Blendshapes** para detectar “cara séria” (baixo valor de sorriso).
- Proximidade da mão à região da boca para o gesto “mão na boca”.

## Observações

- A primeira vez pode demorar um pouco enquanto os modelos são baixados.
- Use boa iluminação para a detecção funcionar melhor.
- Funciona melhor em Chrome/Edge (navegadores com suporte completo ao MediaPipe).
