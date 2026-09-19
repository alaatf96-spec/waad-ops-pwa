#!/usr/bin/env python3
"""Generate Waad Ops dashboard diagram PNGs (Venn, radar, achieve-vs-issues, sample bars).

Dynamic bar charts for live Docs are built in Apps Script via the Charts service.
These PNGs are Drive-hosted templates inserted beside live charts.
"""
from __future__ import annotations
import os
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import Circle, FancyBboxPatch
import numpy as np
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
NAVY, CYAN, MAG, ORANGE = '#1C1C28', '#1FC2F2', '#E4007E', '#EF7A06'
CREAM, SOFT_CYAN, SOFT_MAG, SOFT_OR = '#FBF9F6', '#E8F7FC', '#FCE4F0', '#FFF0E0'


def student_venn():
    fig, ax = plt.subplots(figsize=(6.2, 5.2), facecolor=CREAM)
    ax.set_aspect('equal'); ax.set_xlim(-1.6, 1.6); ax.set_ylim(-1.7, 1.5); ax.axis('off')
    ax.set_title('Support overlap', color=NAVY, fontsize=13, fontweight='bold', pad=6)
    for center, color, a in [((-0.45, 0.15), CYAN, 0.35), ((0.45, 0.15), MAG, 0.30), ((0.0, -0.55), ORANGE, 0.28)]:
        ax.add_patch(Circle(center, 0.95, facecolor=color, alpha=a, edgecolor=color, linewidth=2))
    ax.text(-0.95, 0.85, 'School\nsupport', ha='center', va='center', color=NAVY, fontsize=10, fontweight='bold')
    ax.text(0.95, 0.85, 'Parent\nsupport', ha='center', va='center', color=NAVY, fontsize=10, fontweight='bold')
    ax.text(0.0, -1.35, 'Student\nimprovement', ha='center', va='center', color=NAVY, fontsize=10, fontweight='bold')
    ax.text(0.0, -0.05, 'Joint\nplan', ha='center', va='center', color=NAVY, fontsize=9, fontweight='bold')
    fig.tight_layout()
    fig.savefig(OUT / 'student_support_venn_template.png', dpi=140, facecolor=CREAM)
    plt.close()


def student_radar():
    fig, ax = plt.subplots(figsize=(5.2, 5.2), subplot_kw=dict(polar=True), facecolor=CREAM)
    cats = ['Conduct', 'Effort', 'Parent\nlink', 'SEN\ncare', 'Peer\nrel.', 'Attendance']
    N = len(cats)
    vals = [3.5, 4.0, 3.0, 2.5, 3.8, 4.2] + [3.5]
    angles = np.linspace(0, 2 * np.pi, N, endpoint=False).tolist() + [0]
    ax.set_theta_offset(np.pi / 2); ax.set_theta_direction(-1)
    ax.set_thetagrids(np.degrees(angles[:-1]), cats, fontsize=9, color=NAVY)
    ax.set_ylim(0, 5); ax.set_facecolor('#FFFFFF')
    ax.plot(angles, vals, color=MAG, linewidth=2)
    ax.fill(angles, vals, color=MAG, alpha=0.25)
    ax.plot(angles, [3] * len(angles), color=CYAN, linewidth=1, linestyle='--', alpha=0.6)
    ax.set_title('Pastoral hex stats', color=NAVY, fontsize=12, fontweight='bold', pad=18)
    fig.tight_layout()
    fig.savefig(OUT / 'student_radar_hex_template.png', dpi=140, facecolor=CREAM)
    plt.close()


def teacher_compare():
    fig, ax = plt.subplots(figsize=(7.2, 3.6), facecolor=CREAM)
    ax.set_xlim(0, 10); ax.set_ylim(0, 5); ax.axis('off')
    ax.set_title('Achievements  vs  Issues', color=NAVY, fontsize=13, fontweight='bold', loc='left', pad=4)
    ax.add_patch(FancyBboxPatch((0.3, 0.6), 4.2, 3.6, boxstyle='round,pad=0.05,rounding_size=0.25',
                                facecolor=SOFT_CYAN, edgecolor=CYAN, linewidth=2))
    ax.add_patch(FancyBboxPatch((5.5, 0.6), 4.2, 3.6, boxstyle='round,pad=0.05,rounding_size=0.25',
                                facecolor=SOFT_MAG, edgecolor=MAG, linewidth=2))
    ax.text(2.4, 3.8, 'ACHIEVEMENTS', ha='center', color=CYAN, fontsize=12, fontweight='bold')
    ax.text(7.6, 3.8, 'ISSUES', ha='center', color=MAG, fontsize=12, fontweight='bold')
    ax.text(2.4, 2.4, 'Recognition &\ninitiatives log', ha='center', color=NAVY, fontsize=10)
    ax.text(7.6, 2.4, 'Complaints &\nconduct flags', ha='center', color=NAVY, fontsize=10)
    ax.add_patch(Circle((5.0, 2.2), 0.55, facecolor=SOFT_OR, edgecolor=ORANGE, linewidth=2, alpha=0.9))
    ax.text(5.0, 2.2, 'HR\nnote', ha='center', va='center', fontsize=8, color=NAVY, fontweight='bold')
    fig.tight_layout()
    fig.savefig(OUT / 'teacher_achieve_vs_issues_template.png', dpi=140, facecolor=CREAM)
    plt.close()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    student_venn(); student_radar(); teacher_compare()
    print('wrote', sorted(p.name for p in OUT.glob('*.png')))


if __name__ == '__main__':
    main()
