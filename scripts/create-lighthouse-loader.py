#!/usr/bin/env python3
"""
Script para criar GIF animado do farol GORGEN com feixe de luz girando.
O feixe de luz gira 360 graus ao redor do topo do farol.
"""

import math
from PIL import Image, ImageDraw
import os

# Configurações
OUTPUT_DIR = "/home/ubuntu/consultorio_poc/client/public/assets/loader"
FRAME_COUNT = 24  # Número de frames para uma rotação completa
SIZE = 120  # Tamanho do GIF (120x120 pixels)
DURATION = 80  # Duração de cada frame em ms (total ~2 segundos)

# Cores GORGEN (azul marinho)
GORGEN_BLUE = "#0D3B66"
GORGEN_LIGHT_BLUE = "#1E5F8A"
WHITE = "#FFFFFF"
LIGHT_BEAM = "#FFD700"  # Dourado para o feixe de luz

def create_lighthouse_frame(angle, size=SIZE):
    """Cria um frame do farol com o feixe de luz em um ângulo específico."""
    
    # Criar imagem com fundo transparente
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)
    
    # Centro e dimensões
    cx, cy = size // 2, size // 2
    
    # Desenhar o farol (simplificado para loader)
    # Base/rocha
    rock_points = [
        (cx - 30, cy + 35),
        (cx + 30, cy + 35),
        (cx + 25, cy + 25),
        (cx - 25, cy + 25)
    ]
    draw.polygon(rock_points, fill=GORGEN_BLUE)
    
    # Corpo do farol
    tower_points = [
        (cx - 12, cy + 25),
        (cx + 12, cy + 25),
        (cx + 8, cy - 15),
        (cx - 8, cy - 15)
    ]
    draw.polygon(tower_points, fill=GORGEN_BLUE)
    
    # Faixas horizontais (listras do farol)
    for i, y in enumerate([cy + 15, cy + 5, cy - 5]):
        if i % 2 == 0:
            stripe_width = 12 - (i * 2)
            draw.rectangle([cx - stripe_width, y - 3, cx + stripe_width, y + 3], fill=WHITE)
    
    # Cabine do farol (topo)
    cabin_points = [
        (cx - 10, cy - 15),
        (cx + 10, cy - 15),
        (cx + 8, cy - 25),
        (cx - 8, cy - 25)
    ]
    draw.polygon(cabin_points, fill=GORGEN_BLUE)
    
    # Janela da cabine
    draw.ellipse([cx - 4, cy - 23, cx + 4, cy - 17], fill=LIGHT_BEAM)
    
    # Telhado
    roof_points = [
        (cx - 10, cy - 25),
        (cx + 10, cy - 25),
        (cx, cy - 35)
    ]
    draw.polygon(roof_points, fill=GORGEN_BLUE)
    
    # Feixe de luz girando
    beam_length = 35
    beam_width = 15
    
    # Calcular posição do feixe baseado no ângulo
    rad = math.radians(angle)
    
    # Ponto de origem do feixe (centro da cabine)
    origin_x = cx
    origin_y = cy - 20
    
    # Pontos do feixe (triângulo)
    end_x = origin_x + beam_length * math.cos(rad)
    end_y = origin_y + beam_length * math.sin(rad)
    
    # Largura do feixe nas extremidades
    perp_rad = rad + math.pi / 2
    half_width = beam_width / 2
    
    beam_points = [
        (origin_x, origin_y),
        (end_x + half_width * math.cos(perp_rad), end_y + half_width * math.sin(perp_rad)),
        (end_x - half_width * math.cos(perp_rad), end_y - half_width * math.sin(perp_rad))
    ]
    
    # Desenhar feixe com gradiente (simulado com múltiplas camadas)
    for i in range(3, 0, -1):
        alpha = int(255 * (i / 3) * 0.6)
        scale = 1 + (3 - i) * 0.1
        scaled_points = [
            (origin_x, origin_y),
            (origin_x + (beam_points[1][0] - origin_x) * scale, 
             origin_y + (beam_points[1][1] - origin_y) * scale),
            (origin_x + (beam_points[2][0] - origin_x) * scale, 
             origin_y + (beam_points[2][1] - origin_y) * scale)
        ]
        # Criar cor com alpha
        beam_color = (255, 215, 0, alpha)  # Dourado com transparência
        draw.polygon(scaled_points, fill=beam_color)
    
    # Ondas na base
    wave_y = cy + 40
    for i in range(3):
        wave_start = cx - 35 + i * 20
        draw.arc([wave_start, wave_y - 5, wave_start + 15, wave_y + 5], 
                 0, 180, fill=GORGEN_BLUE, width=2)
    
    return img


def create_loader_gif():
    """Cria o GIF animado completo."""
    
    # Criar diretório de saída
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    frames = []
    
    # Gerar frames para rotação completa (360 graus)
    for i in range(FRAME_COUNT):
        angle = (360 / FRAME_COUNT) * i - 90  # Começar do topo (-90 graus)
        frame = create_lighthouse_frame(angle)
        frames.append(frame)
    
    # Salvar como GIF
    gif_path = os.path.join(OUTPUT_DIR, "gorgen-loader.gif")
    frames[0].save(
        gif_path,
        save_all=True,
        append_images=frames[1:],
        duration=DURATION,
        loop=0,  # Loop infinito
        transparency=0,
        disposal=2  # Limpar frame anterior
    )
    
    print(f"✅ GIF criado: {gif_path}")
    
    # Criar versão menor para uso em botões (64x64)
    small_frames = []
    for i in range(FRAME_COUNT):
        angle = (360 / FRAME_COUNT) * i - 90
        frame = create_lighthouse_frame(angle, size=64)
        small_frames.append(frame)
    
    small_gif_path = os.path.join(OUTPUT_DIR, "gorgen-loader-small.gif")
    small_frames[0].save(
        small_gif_path,
        save_all=True,
        append_images=small_frames[1:],
        duration=DURATION,
        loop=0,
        transparency=0,
        disposal=2
    )
    
    print(f"✅ GIF pequeno criado: {small_gif_path}")
    
    # Criar versão grande para tela de loading (200x200)
    large_frames = []
    for i in range(FRAME_COUNT):
        angle = (360 / FRAME_COUNT) * i - 90
        frame = create_lighthouse_frame(angle, size=200)
        large_frames.append(frame)
    
    large_gif_path = os.path.join(OUTPUT_DIR, "gorgen-loader-large.gif")
    large_frames[0].save(
        large_gif_path,
        save_all=True,
        append_images=large_frames[1:],
        duration=DURATION,
        loop=0,
        transparency=0,
        disposal=2
    )
    
    print(f"✅ GIF grande criado: {large_gif_path}")
    
    return gif_path, small_gif_path, large_gif_path


if __name__ == "__main__":
    create_loader_gif()
