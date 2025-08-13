#!/usr/bin/env python3

import tkinter as tk
from tkinter import ttk, messagebox, scrolledtext, filedialog
from itertools import product
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import textwrap
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from matplotlib.figure import Figure
from matplotlib.backends.backend_pdf import PdfPages
import json
import os

# Datos del plan de estudios 2017 - Ingeniería Industrial
PLAN_ESTUDIOS = {
    "Primer Año - Primer Semestre": {
        "1701102": {"nombre": "RAZONAMIENTO LOGICO MATEMATICO", "creditos": 3},
        "1701103": {"nombre": "MATEMATICA BASICA", "creditos": 4},
        "1701104": {"nombre": "CALCULO 1", "creditos": 5},
        "1701105": {"nombre": "QUIMICA GENERAL", "creditos": 4},
        "1701106": {"nombre": "DIBUJO EN INGENIERIA", "creditos": 3},
        "1701121": {"nombre": "METODOLOGIA DEL TRABAJO INTELECTUAL UNIVERSITARIO", "creditos": 2},
        "1701122": {"nombre": "INTRODUCCION A LA INGENIERIA INDUSTRIAL", "creditos": 3}
    },
    "Primer Año - Segundo Semestre": {
        "1701208": {"nombre": "REALIDAD NACIONAL", "creditos": 2},
        "1701210": {"nombre": "CALCULO 2", "creditos": 5},
        "1701211": {"nombre": "FISICA 1", "creditos": 4},
        "1701212": {"nombre": "QUIMICA ORGANICA", "creditos": 4},
        "1701213": {"nombre": "GEOMETRIA DESCRIPTIVA", "creditos": 3},
        "1701223": {"nombre": "COMUNICACION INTEGRAL", "creditos": 3}
    },
    "Segundo Año - Primer Semestre": {
        "1702114": {"nombre": "CIUDADANIA E INTERCULTURALIDAD", "creditos": 2},
        "1702115": {"nombre": "ECONOMIA EN INGENIERIA", "creditos": 3},
        "1702116": {"nombre": "FISICOQUIMICA", "creditos": 3},
        "1702117": {"nombre": "FISICA 2", "creditos": 4},
        "1702118": {"nombre": "ECUACIONES DIFERENCIALES", "creditos": 4},
        "1702119": {"nombre": "ESTATICA Y RESISTENCIA DE MATERIALES", "creditos": 3},
        "1702120": {"nombre": "PROGRAMACION Y METODOS NUMERICOS", "creditos": 3}
    },
    "Segundo Año - Segundo Semestre": {
        "1702224": {"nombre": "INGLES", "creditos": 3},
        "1702225": {"nombre": "PSICOLOGIA ORGANIZACIONAL", "creditos": 4},
        "1702226": {"nombre": "ECOLOGIA Y CONSERVACION AMBIENTAL", "creditos": 2},
        "1702227": {"nombre": "ANALISIS DE DATOS 1", "creditos": 4},
        "1702228": {"nombre": "TERMODINAMICA", "creditos": 4},
        "1702229": {"nombre": "ELECTRICIDAD Y ELECTRONICA INDUSTRIAL", "creditos": 3},
        "1702230": {"nombre": "INGENIERIA FINANCIERA 1", "creditos": 4}
    },
    "Tercer Año - Primer Semestre": {
        "1703131": {"nombre": "INTRODUCCION A LA METODOLOGIA DE LA INVESTIGACION CIENTIFICA", "creditos": 3},
        "1703132": {"nombre": "ANALISIS DE DATOS 2", "creditos": 3},
        "1703133": {"nombre": "INGENIERIA ECONOMICA", "creditos": 3},
        "1703134": {"nombre": "INGENIERIA DE METODOS 1", "creditos": 4},
        "1703135": {"nombre": "CONTROL DE PROCESOS", "creditos": 3},
        "1703136": {"nombre": "INGENIERIA DE COSTOS Y PRESUPUESTOS", "creditos": 4},
        "1703137": {"nombre": "OPERACIONES UNITARIAS", "creditos": 4}
    },
    "Tercer Año - Segundo Semestre": {
        "1703238": {"nombre": "INVESTIGACION OPERATIVA 1", "creditos": 4},
        "1703239": {"nombre": "INGENIERIA DE METODOS 2", "creditos": 4},
        "1703240": {"nombre": "PROCESOS DE MANUFACTURA", "creditos": 4},
        "1703241": {"nombre": "INGENIERIA DE SEGURIDAD", "creditos": 4},
        "1703242": {"nombre": "INGENIERIA DE PRODUCCION", "creditos": 4},
        "1703243": {"nombre": "INGENIERIA FINANCIERA 2", "creditos": 4},
        "1703244": {"nombre": "INGENIERIA DE MATERIALES (E)", "creditos": 3},
        "1703245": {"nombre": "DISENO INDUSTRIAL (E)", "creditos": 3}
    },
    "Cuarto Año - Primer Semestre": {
        "1704146": {"nombre": "GESTION DEL TALENTO HUMANO", "creditos": 3},
        "1704147": {"nombre": "ANALISIS E INVESTIGACION DE MERCADO", "creditos": 4},
        "1704148": {"nombre": "INVESTIGACION OPERATIVA 2", "creditos": 4},
        "1704149": {"nombre": "SISTEMAS DE INFORMACION", "creditos": 4},
        "1704150": {"nombre": "EMPRENDIMIENTO E INNOVACION (E)", "creditos": 3},
        "1704151": {"nombre": "INGENIERIA ERGONOMICA (E)", "creditos": 3},
        "1704152": {"nombre": "GESTION DE OPERACIONES (E)", "creditos": 3},
        "1704173": {"nombre": "ETICA GENERAL Y PROFESIONAL", "creditos": 2}
    },
    "Cuarto Año - Segundo Semestre": {
        "1704253": {"nombre": "FORMULACION Y EVALUACION DE PROYECTOS", "creditos": 4},
        "1704254": {"nombre": "AUTOMATIZACION INDUSTRIAL", "creditos": 4},
        "1704255": {"nombre": "GERENCIA DE MARKETING", "creditos": 4},
        "1704256": {"nombre": "INGENIERIA DE MANTENIMIENTO", "creditos": 4},
        "1704257": {"nombre": "SISTEMAS DE GESTION DE LA CALIDAD (E)", "creditos": 3},
        "1704258": {"nombre": "LEGISLACION LABORAL Y TRIBUTARIA (E)", "creditos": 3},
        "1704259": {"nombre": "GESTION AMBIENTAL (E)", "creditos": 2}
    },
    "Quinto Año - Primer Semestre": {
        "1705160": {"nombre": "ADMINISTRACION ESTRATEGICA", "creditos": 4},
        "1705161": {"nombre": "INGENIERIA DEL PRODUCTO", "creditos": 4},
        "1705162": {"nombre": "LOGISTICA INDUSTRIAL", "creditos": 4},
        "1705163": {"nombre": "SIMULACION DE SISTEMAS", "creditos": 3},
        "1705165": {"nombre": "GESTION DE PROYECTOS (E)", "creditos": 2},
        "1705166": {"nombre": "SISTEMAS INTELIGENTES (E)", "creditos": 2}
    },
    "Quinto Año - Segundo Semestre": {
        "1705267": {"nombre": "SEMINARIO DE TESIS", "creditos": 5},
        "1705268": {"nombre": "PRACTICAS PRE PROFESIONALES", "creditos": 6},
        "1705269": {"nombre": "INDUSTRIA TEXTIL Y CONFECCIONES (E)", "creditos": 2},
        "1705270": {"nombre": "COMERCIO INTERNACIONAL (E)", "creditos": 2},
        "1705271": {"nombre": "PROYECTOS DE INVERSION PUBLICA (E)", "creditos": 2},
        "1705272": {"nombre": "AGRONEGOCIOS (E)", "creditos": 2}
    }
}

class ScheduleGeneratorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Generador de Horarios - Ingeniería Industrial")
        self.root.geometry("1300x750")
        
        # Variables
        self.cursos_horarios = {}
        self.semestres_seleccionados = []
        self.cursos_seleccionados = {}
        self.total_creditos = 0
        self.combinaciones_generadas = []
        
        # Crear interfaz
        self.crear_interfaz()
        
    def crear_interfaz(self):
        # Notebook para las pestañas
        notebook = ttk.Notebook(self.root)
        notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Pestaña 1: Selección de cursos
        self.frame_seleccion = ttk.Frame(notebook)
        notebook.add(self.frame_seleccion, text="Selección de Cursos")
        
        # Pestaña 2: Configuración de horarios
        self.frame_horarios = ttk.Frame(notebook)
        notebook.add(self.frame_horarios, text="Configuración de Horarios")
        
        # Pestaña 3: Generar horario
        self.frame_generar = ttk.Frame(notebook)
        notebook.add(self.frame_generar, text="Generar Horarios")
        
        self.crear_pestaña_seleccion()
        self.crear_pestaña_horarios()
        self.crear_pestaña_generar()
        
    def crear_pestaña_seleccion(self):
        # Frame principal
        main_frame = ttk.Frame(self.frame_seleccion)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Título
        ttk.Label(main_frame, text="SELECCIÓN DE CURSOS", font=('Arial', 16, 'bold')).pack(pady=(0, 20))
        
        # Frame para semestres
        semestre_frame = ttk.LabelFrame(main_frame, text="1. Seleccionar Semestres", padding=10)
        semestre_frame.pack(fill=tk.X, pady=(0, 20))
        
        # Lista de semestres disponibles
        semestres_disponibles = list(PLAN_ESTUDIOS.keys())
        self.semestres_vars = {}
        
        # Organizar por columnas
        cols = 2
        for i, semestre in enumerate(semestres_disponibles):
            row = i // cols
            col = i % cols
            
            var = tk.BooleanVar()
            self.semestres_vars[semestre] = var
            cb = ttk.Checkbutton(semestre_frame, text=semestre, variable=var,
                               command=self.on_semestre_change)
            cb.grid(row=row, column=col, sticky='w', padx=10, pady=2)
        
        # Frame para cursos
        cursos_frame = ttk.LabelFrame(main_frame, text="2. Seleccionar Cursos", padding=10)
        cursos_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        
        # Frame con scroll para cursos
        canvas = tk.Canvas(cursos_frame)
        scrollbar = ttk.Scrollbar(cursos_frame, orient="vertical", command=canvas.yview)
        self.scrollable_frame = ttk.Frame(canvas)
        
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
        self.cursos_vars = {}
        
        # Frame para resumen
        resumen_frame = ttk.LabelFrame(main_frame, text="Resumen", padding=10)
        resumen_frame.pack(fill=tk.X)
        
        self.label_creditos = ttk.Label(resumen_frame, text="Total de Créditos: 0", 
                                      font=('Arial', 12, 'bold'))
        self.label_creditos.pack()
        
        self.label_cursos = ttk.Label(resumen_frame, text="Cursos seleccionados: 0")
        self.label_cursos.pack()
        
    def crear_pestaña_horarios(self):
        # Frame principal
        main_frame = ttk.Frame(self.frame_horarios)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Título
        ttk.Label(main_frame, text="CONFIGURACIÓN DE HORARIOS", font=('Arial', 16, 'bold')).pack(pady=(0, 20))
        
        # Frame para seleccionar curso
        select_frame = ttk.LabelFrame(main_frame, text="Seleccionar Curso para Configurar", padding=10)
        select_frame.pack(fill=tk.X, pady=(0, 20))
        
        self.combo_cursos = ttk.Combobox(select_frame, state="readonly", width=50)
        self.combo_cursos.pack(side=tk.LEFT, padx=(0, 10))
        self.combo_cursos.bind("<<ComboboxSelected>>", self.on_curso_selected)
        
        ttk.Button(select_frame, text="Configurar Horarios", 
                  command=self.abrir_config_horario).pack(side=tk.LEFT)
        
        # Frame para mostrar configuración actual
        config_frame = ttk.LabelFrame(main_frame, text="Configuración Actual", padding=10)
        config_frame.pack(fill=tk.BOTH, expand=True)
        
        self.tree_config = ttk.Treeview(config_frame, columns=('Curso', 'Grupo', 'Horarios'), show='headings')
        self.tree_config.heading('Curso', text='Curso')
        self.tree_config.heading('Grupo', text='Grupo')
        self.tree_config.heading('Horarios', text='Horarios')
        
        self.tree_config.column('Curso', width=300)
        self.tree_config.column('Grupo', width=100)
        self.tree_config.column('Horarios', width=400)
        
        scrollbar_tree = ttk.Scrollbar(config_frame, orient=tk.VERTICAL, command=self.tree_config.yview)
        self.tree_config.configure(yscrollcommand=scrollbar_tree.set)
        
        self.tree_config.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar_tree.pack(side=tk.RIGHT, fill=tk.Y)
        
    def crear_pestaña_generar(self):
        # Frame principal
        main_frame = ttk.Frame(self.frame_generar)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Título
        ttk.Label(main_frame, text="GENERAR HORARIOS", font=('Arial', 16, 'bold')).pack(pady=(0, 20))
        
        # Frame para botones superiores
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X, pady=(0, 10))
        
        # Botón para generar
        ttk.Button(buttons_frame, text="Generar Todas las Combinaciones Posibles", 
                  command=self.generar_horarios, style='Accent.TButton').pack(side=tk.LEFT, padx=(0, 10))
        
        # Botón para exportar PDF
        ttk.Button(buttons_frame, text="Exportar Seleccionados a PDF", 
                  command=self.exportar_pdf, style='Accent.TButton').pack(side=tk.LEFT)
        
        # Frame para resultados
        result_frame = ttk.LabelFrame(main_frame, text="Resultados", padding=10)
        result_frame.pack(fill=tk.BOTH, expand=True)
        
        # Frame izquierdo para lista de combinaciones
        left_frame = ttk.Frame(result_frame)
        left_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        
        ttk.Label(left_frame, text="Combinaciones Válidas:").pack()
        
        # Frame para controles de selección
        selection_frame = ttk.Frame(left_frame)
        selection_frame.pack(fill=tk.X, pady=(5, 5))
        
        ttk.Button(selection_frame, text="Seleccionar Todo", 
                  command=self.seleccionar_todo).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(selection_frame, text="Limpiar Selección", 
                  command=self.limpiar_seleccion).pack(side=tk.LEFT)
        
        # Listbox con checkboxes simulados
        listbox_frame = ttk.Frame(left_frame)
        listbox_frame.pack(fill=tk.BOTH, expand=True)
        
        # Canvas y scrollbar para la lista personalizada
        canvas_list = tk.Canvas(listbox_frame, width=300)
        scrollbar_list = ttk.Scrollbar(listbox_frame, orient="vertical", command=canvas_list.yview)
        self.scrollable_list = ttk.Frame(canvas_list)
        
        self.scrollable_list.bind(
            "<Configure>",
            lambda e: canvas_list.configure(scrollregion=canvas_list.bbox("all"))
        )
        
        canvas_list.create_window((0, 0), window=self.scrollable_list, anchor="nw")
        canvas_list.configure(yscrollcommand=scrollbar_list.set)
        
        canvas_list.pack(side="left", fill="both", expand=True)
        scrollbar_list.pack(side="right", fill="y")
        
        self.combinaciones_vars = {}
        
        # Frame derecho para visualización
        viz_frame = ttk.Frame(result_frame)
        viz_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)
        
        self.figure = Figure(figsize=(10, 6), dpi=80)
        self.canvas_plot = FigureCanvasTkAgg(self.figure, viz_frame)
        self.canvas_plot.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        
    def on_semestre_change(self):
        # Actualizar lista de semestres seleccionados
        self.semestres_seleccionados = [sem for sem, var in self.semestres_vars.items() if var.get()]
        
        # Validar paridad de semestres
        if len(self.semestres_seleccionados) > 1:
            tipos_semestre = set()
            for sem in self.semestres_seleccionados:
                if "Primer Semestre" in sem:
                    tipos_semestre.add("impar")
                else:
                    tipos_semestre.add("par")
            
            if len(tipos_semestre) > 1:
                messagebox.showwarning("Advertencia", 
                    "No puedes mezclar semestres pares e impares.\nSe mantendrá solo la última selección.")
                # Mantener solo el último seleccionado
                ultimo_semestre = self.semestres_seleccionados[-1]
                for sem, var in self.semestres_vars.items():
                    if sem != ultimo_semestre:
                        var.set(False)
                self.semestres_seleccionados = [ultimo_semestre]
        
        self.actualizar_cursos_disponibles()
        
    def actualizar_cursos_disponibles(self):
        # Limpiar cursos anteriores
        for widget in self.scrollable_frame.winfo_children():
            widget.destroy()
        self.cursos_vars.clear()
        
        # Agregar cursos de semestres seleccionados
        row = 0
        for semestre in self.semestres_seleccionados:
            # Título del semestre
            ttk.Label(self.scrollable_frame, text=semestre, 
                     font=('Arial', 12, 'bold')).grid(row=row, column=0, columnspan=3, 
                                                    sticky='w', pady=(10, 5))
            row += 1
            
            # Cursos del semestre
            for codigo, info in PLAN_ESTUDIOS[semestre].items():
                var = tk.BooleanVar()
                self.cursos_vars[codigo] = var
                
                cb = ttk.Checkbutton(self.scrollable_frame, text=f"{info['nombre']}", 
                                   variable=var, command=self.actualizar_resumen)
                cb.grid(row=row, column=0, sticky='w', padx=20)
                
                ttk.Label(self.scrollable_frame, text=f"({codigo})").grid(row=row, column=1, 
                                                                        sticky='w', padx=10)
                
                ttk.Label(self.scrollable_frame, text=f"{info['creditos']} créditos").grid(row=row, column=2, 
                                                                                        sticky='w', padx=10)
                row += 1
        
        self.actualizar_resumen()
        
    def actualizar_resumen(self):
        # Calcular créditos totales y cursos seleccionados
        total_creditos = 0
        cursos_seleccionados = 0
        
        self.cursos_seleccionados.clear()
        
        for codigo, var in self.cursos_vars.items():
            if var.get():
                cursos_seleccionados += 1
                # Buscar el curso en todos los semestres
                for semestre, cursos in PLAN_ESTUDIOS.items():
                    if codigo in cursos:
                        creditos = cursos[codigo]['creditos']
                        nombre = cursos[codigo]['nombre']
                        total_creditos += creditos
                        self.cursos_seleccionados[codigo] = {
                            'nombre': nombre,
                            'creditos': creditos
                        }
                        break
        
        self.total_creditos = total_creditos
        self.label_creditos.config(text=f"Total de Créditos: {total_creditos}")
        self.label_cursos.config(text=f"Cursos seleccionados: {cursos_seleccionados}")
        
        # Actualizar combo de cursos en la pestaña de horarios
        cursos_nombres = [f"{codigo} - {info['nombre']}" for codigo, info in self.cursos_seleccionados.items()]
        self.combo_cursos['values'] = cursos_nombres
        
    def on_curso_selected(self, event):
        # Habilitar botón de configurar horarios
        pass
        
    def abrir_config_horario(self):
        if not self.combo_cursos.get():
            messagebox.showwarning("Advertencia", "Selecciona un curso primero")
            return
            
        curso_seleccionado = self.combo_cursos.get().split(" - ")[0]
        nombre_curso = self.cursos_seleccionados[curso_seleccionado]['nombre']
        
        # Ventana de configuración de horario
        self.ventana_horario = tk.Toplevel(self.root)
        self.ventana_horario.title(f"Configurar Horarios - {nombre_curso}")
        self.ventana_horario.geometry("800x600")
        
        # Crear interfaz de configuración de horario
        self.crear_interfaz_horario(curso_seleccionado, nombre_curso)
        
    def crear_interfaz_horario(self, codigo_curso, nombre_curso):
        main_frame = ttk.Frame(self.ventana_horario)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Título
        ttk.Label(main_frame, text=f"Configurar Horarios: {nombre_curso}", 
                 font=('Arial', 14, 'bold')).pack(pady=(0, 20))
        
        # Notebook para grupos
        notebook = ttk.Notebook(main_frame)
        notebook.pack(fill=tk.BOTH, expand=True, pady=(0, 20))
        
        # Inicializar estructura de datos si no existe
        if codigo_curso not in self.cursos_horarios:
            self.cursos_horarios[codigo_curso] = {}
        
        self.grupos_frames = {}
        
        # Crear pestañas para grupos A, B, C, D, E, F
        for grupo in ['A', 'B', 'C', 'D', 'E', 'F']:
            frame_grupo = ttk.Frame(notebook)
            notebook.add(frame_grupo, text=f"Grupo {grupo}")
            self.grupos_frames[grupo] = frame_grupo
            
            self.crear_interfaz_grupo(frame_grupo, codigo_curso, grupo)
        
        # Botones
        btn_frame = ttk.Frame(main_frame)
        btn_frame.pack(fill=tk.X)
        
        ttk.Button(btn_frame, text="Guardar Configuración", 
                  command=lambda: self.guardar_horario(codigo_curso)).pack(side=tk.LEFT, padx=(0, 10))
        ttk.Button(btn_frame, text="Cancelar", 
                  command=self.ventana_horario.destroy).pack(side=tk.LEFT)
        
    def crear_interfaz_grupo(self, frame, codigo_curso, grupo):
        # Frame principal con scroll
        canvas = tk.Canvas(frame)
        scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview)
        scrollable_frame = ttk.Frame(canvas)
        
        scrollable_frame.bind(
            "<Configure>",
            lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
        )
        
        canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
        canvas.configure(yscrollcommand=scrollbar.set)
        
        # Checkbox para habilitar grupo
        enable_var = tk.BooleanVar()
        if codigo_curso in self.cursos_horarios and grupo in self.cursos_horarios[codigo_curso]:
            enable_var.set(True)
            
        ttk.Checkbutton(scrollable_frame, text=f"Habilitar Grupo {grupo}", 
                       variable=enable_var).pack(anchor='w', pady=(0, 10))
        
        # Frame para horarios
        horarios_frame = ttk.LabelFrame(scrollable_frame, text="Horarios", padding=10)
        horarios_frame.pack(fill=tk.BOTH, expand=True)
        
        # Lista para almacenar horarios del grupo
        horarios_list = []
        
        def agregar_horario():
            horario_frame = ttk.Frame(horarios_frame)
            horario_frame.pack(fill=tk.X, pady=5)
            
            # Día
            ttk.Label(horario_frame, text="Día:").grid(row=0, column=0, padx=5)
            dia_var = tk.StringVar()
            dia_combo = ttk.Combobox(horario_frame, textvariable=dia_var, values=[
                "Lunes", "Martes", "Miércoles", "Jueves", "Viernes"
            ], state="readonly", width=10)
            dia_combo.grid(row=0, column=1, padx=5)
            
            # Hora inicio
            ttk.Label(horario_frame, text="Inicio:").grid(row=0, column=2, padx=5)
            inicio_var = tk.StringVar()
            inicio_combo = ttk.Combobox(horario_frame, textvariable=inicio_var, values=[
                "07:00", "07:50", "08:50", "09:40", "10:40", "11:30", "12:20", "13:10",
                "14:00", "14:50", "15:50", "16:40", "17:40", "18:30", "19:20", "20:10"
            ], state="readonly", width=8)
            inicio_combo.grid(row=0, column=3, padx=5)
            
            # Hora fin
            ttk.Label(horario_frame, text="Fin:").grid(row=0, column=4, padx=5)
            fin_var = tk.StringVar()
            fin_combo = ttk.Combobox(horario_frame, textvariable=fin_var, values=[
                "07:50", "08:40", "09:40", "10:30", "11:30", "12:20", "13:10", "14:00",
                "14:50", "15:40", "16:40", "17:30", "18:30", "19:20", "20:10", "21:00"
            ], state="readonly", width=8)
            fin_combo.grid(row=0, column=5, padx=5)
            
            # Botón eliminar
            ttk.Button(horario_frame, text="Eliminar", 
                      command=lambda: eliminar_horario(horario_frame, {
                          'dia': dia_var, 'inicio': inicio_var, 'fin': fin_var
                      })).grid(row=0, column=6, padx=5)
            
            horarios_list.append({
                'frame': horario_frame,
                'dia': dia_var,
                'inicio': inicio_var,
                'fin': fin_var
            })
        
        def eliminar_horario(frame, horario_data):
            frame.destroy()
            horarios_list[:] = [h for h in horarios_list if h['frame'] != frame]
        
        # Cargar horarios existentes si los hay
        if (codigo_curso in self.cursos_horarios and 
            grupo in self.cursos_horarios[codigo_curso]):
            for horario in self.cursos_horarios[codigo_curso][grupo]['horarios']:
                agregar_horario()
                horarios_list[-1]['dia'].set(horario['día'])
                horarios_list[-1]['inicio'].set(horario['inicio'])
                horarios_list[-1]['fin'].set(horario['fin'])
        
        # Botón para agregar horario
        ttk.Button(scrollable_frame, text="Agregar Horario", 
                  command=agregar_horario).pack(pady=10)
        
        # Guardar referencias para acceso posterior
        if not hasattr(self, 'grupos_data'):
            self.grupos_data = {}
        self.grupos_data[f"{codigo_curso}_{grupo}"] = {
            'enable_var': enable_var,
            'horarios_list': horarios_list
        }
        
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
        
    def guardar_horario(self, codigo_curso):
        nombre_curso = self.cursos_seleccionados[codigo_curso]['nombre']
        
        # Limpiar horarios anteriores
        self.cursos_horarios[codigo_curso] = {}
        
        # Guardar horarios de cada grupo
        for grupo in ['A', 'B', 'C', 'D', 'E', 'F']:
            key = f"{codigo_curso}_{grupo}"
            if key in self.grupos_data:
                data = self.grupos_data[key]
                if data['enable_var'].get():  # Si el grupo está habilitado
                    horarios = []
                    for h in data['horarios_list']:
                        dia = h['dia'].get()
                        inicio = h['inicio'].get()
                        fin = h['fin'].get()
                        
                        if dia and inicio and fin:
                            horarios.append({
                                'día': dia,
                                'inicio': inicio,
                                'fin': fin
                            })
                    
                    if horarios:  # Solo guardar si hay horarios
                        self.cursos_horarios[codigo_curso][grupo] = {
                            'grupo': grupo,
                            'horarios': horarios
                        }
        
        self.ventana_horario.destroy()
        self.actualizar_tree_configuracion()
        messagebox.showinfo("Éxito", f"Horarios guardados para {nombre_curso}")
        
    def actualizar_tree_configuracion(self):
        # Limpiar tree
        for item in self.tree_config.get_children():
            self.tree_config.delete(item)
        
        # Agregar configuraciones actuales
        for codigo_curso, grupos in self.cursos_horarios.items():
            nombre_curso = self.cursos_seleccionados[codigo_curso]['nombre']
            for grupo, data in grupos.items():
                horarios_str = ", ".join([
                    f"{h['día']} {h['inicio']}-{h['fin']}" for h in data['horarios']
                ])
                self.tree_config.insert('', tk.END, values=(
                    nombre_curso, grupo, horarios_str
                ))
    
    def generar_horarios(self):
        if not self.cursos_horarios:
            messagebox.showwarning("Advertencia", 
                "Debes configurar al menos un horario para los cursos seleccionados")
            return
        
        # Verificar que todos los cursos seleccionados tengan horarios
        cursos_sin_horario = []
        for codigo in self.cursos_seleccionados.keys():
            if codigo not in self.cursos_horarios or not self.cursos_horarios[codigo]:
                cursos_sin_horario.append(self.cursos_seleccionados[codigo]['nombre'])
        
        if cursos_sin_horario:
            messagebox.showwarning("Advertencia", 
                f"Los siguientes cursos no tienen horarios configurados:\n" + 
                "\n".join(cursos_sin_horario))
            return
        
        # Generar combinaciones
        combinaciones = list(self.combinaciones_validas())
        
        # Limpiar lista anterior
        for widget in self.scrollable_list.winfo_children():
            widget.destroy()
        self.combinaciones_vars.clear()
        
        if not combinaciones:
            messagebox.showinfo("Resultado", "No se encontraron combinaciones válidas sin choques de horario")
            return
        
        # Crear checkboxes para cada combinación
        for i, comb in enumerate(combinaciones, 1):
            var = tk.BooleanVar()
            self.combinaciones_vars[i] = var
            
            frame = ttk.Frame(self.scrollable_list)
            frame.pack(fill=tk.X, pady=2)
            
            cb = ttk.Checkbutton(frame, text=f"Combinación {i}", variable=var)
            cb.pack(side=tk.LEFT)
            
            # Botón para ver/previsualizar
            ttk.Button(frame, text="Ver", 
                      command=lambda idx=i-1: self.previsualizar_combinacion(idx)).pack(side=tk.RIGHT)
        
        self.combinaciones_generadas = combinaciones
        messagebox.showinfo("Resultado", f"Se encontraron {len(combinaciones)} combinaciones válidas")
        
    def seleccionar_todo(self):
        for var in self.combinaciones_vars.values():
            var.set(True)
            
    def limpiar_seleccion(self):
        for var in self.combinaciones_vars.values():
            var.set(False)
            
    def previsualizar_combinacion(self, idx):
        if idx < len(self.combinaciones_generadas):
            combinacion = self.combinaciones_generadas[idx]
            self.dibujar_horario(combinacion)
            
    def exportar_pdf(self):
        # Obtener combinaciones seleccionadas
        seleccionadas = []
        for i, var in self.combinaciones_vars.items():
            if var.get():
                seleccionadas.append(i - 1)  # Ajustar índice
        
        if not seleccionadas:
            messagebox.showwarning("Advertencia", "Selecciona al menos una combinación para exportar")
            return
        
        # Solicitar nombre del archivo
        filename = filedialog.asksaveasfilename(
            defaultextension=".pdf",
            filetypes=[("PDF files", "*.pdf")],
            title="Guardar horarios como PDF"
        )
        
        if not filename:
            return
            
        try:
            with PdfPages(filename) as pdf:
                for idx in seleccionadas:
                    if idx < len(self.combinaciones_generadas):
                        combinacion = self.combinaciones_generadas[idx]
                        
                        # Crear figura para PDF
                        fig = plt.figure(figsize=(11, 8))
                        ax = fig.add_subplot(111)
                        
                        self.dibujar_horario_pdf(ax, combinacion, idx + 1)
                        
                        pdf.savefig(fig, bbox_inches='tight')
                        plt.close(fig)
                        
            messagebox.showinfo("Éxito", f"PDF guardado exitosamente como:\n{filename}")
            
        except Exception as e:
            messagebox.showerror("Error", f"Error al generar PDF:\n{str(e)}")
    
    def combinaciones_validas(self):
        # Obtener todos los grupos de cada curso
        cursos_grupos = []
        for codigo_curso in self.cursos_seleccionados.keys():
            if codigo_curso in self.cursos_horarios:
                grupos = list(self.cursos_horarios[codigo_curso].values())
                cursos_grupos.append(grupos)
        
        # Generar todas las combinaciones posibles
        for combinacion in product(*cursos_grupos):
            if self.combinacion_valida(combinacion):
                yield combinacion
    
    def combinacion_valida(self, combinacion):
        # Verificar que no hay choques entre horarios
        for i in range(len(combinacion)):
            for j in range(i + 1, len(combinacion)):
                if self.horarios_se_cruzan(
                    combinacion[i]['horarios'], 
                    combinacion[j]['horarios']
                ):
                    return False
        return True
    
    def horarios_se_cruzan(self, horarios1, horarios2):
        for h1 in horarios1:
            for h2 in horarios2:
                if h1["día"] == h2["día"]:
                    # Convertir horas a minutos para comparación
                    h1_inicio = self.hora_a_minutos(h1["inicio"])
                    h1_fin = self.hora_a_minutos(h1["fin"])
                    h2_inicio = self.hora_a_minutos(h2["inicio"])
                    h2_fin = self.hora_a_minutos(h2["fin"])
                    
                    # Verificar solapamiento
                    if not (h1_fin <= h2_inicio or h2_fin <= h1_inicio):
                        return True
        return False
    
    def hora_a_minutos(self, hora_str):
        h, m = map(int, hora_str.split(":"))
        return h * 60 + m
    
    def dibujar_horario(self, combinacion):
        self.figure.clear()
        ax = self.figure.add_subplot(111)
        self.dibujar_horario_base(ax, combinacion, "Previsualización de Horario")
        self.canvas_plot.draw()
        
    def dibujar_horario_pdf(self, ax, combinacion, numero_combinacion):
        titulo = f"Combinación {numero_combinacion} - Horario de Clases"
        self.dibujar_horario_base(ax, combinacion, titulo)
        
    def dibujar_horario_base(self, ax, combinacion, titulo):
        # Configuración
        dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
        time_slots = [
            ("07:00","07:50"), ("07:50","08:40"), ("08:50","09:40"), ("09:40","10:30"),
            ("10:40","11:30"), ("11:30","12:20"), ("12:20","13:10"), ("13:10","14:00"),
            ("14:00","14:50"), ("14:50","15:40"), ("15:50","16:40"), ("16:40","17:30"),
            ("17:40","18:30"), ("18:30","19:20"), ("19:20","20:10"), ("20:10","21:00")
        ]
        
        n_slots = len(time_slots)
        
        # Crear mapa de colores
        cursos_nombres = []
        for codigo in self.cursos_seleccionados.keys():
            cursos_nombres.append(self.cursos_seleccionados[codigo]['nombre'])
        
        cmap = plt.cm.get_cmap('tab10', len(cursos_nombres))
        color_map = {nombre: cmap(i) for i, nombre in enumerate(cursos_nombres)}
        
        # Dibujar rejilla
        for x in range(len(dias) + 1):
            lw = 2 if x == 0 or x == len(dias) else 1
            ax.axvline(x, 0, n_slots, color='black', linewidth=lw)
        for y in range(n_slots + 1):
            lw = 2 if y == 0 or y == n_slots else 1
            ax.axhline(y, 0, len(dias), color='black', linewidth=lw)
        
        # Configurar ejes
        ax.set_xlim(0, len(dias))
        ax.set_ylim(0, n_slots)
        ax.set_xticks([i + 0.5 for i in range(len(dias))])
        ax.set_xticklabels(dias, fontsize=11, weight='bold')
        ax.set_yticks([i + 0.5 for i in range(n_slots)])
        ax.set_yticklabels([f"{s}-{e}" for s, e in time_slots], fontsize=9)
        ax.invert_yaxis()
        
        # Dibujar bloques de clases
        for i, grupo in enumerate(combinacion):
            # Encontrar el nombre del curso
            codigo_curso = None
            for codigo, data in self.cursos_horarios.items():
                if grupo in data.values():
                    codigo_curso = codigo
                    break
            
            if codigo_curso:
                nombre_curso = self.cursos_seleccionados[codigo_curso]['nombre']
                color = color_map[nombre_curso]
                
                for horario in grupo['horarios']:
                    day_idx = dias.index(horario['día'])
                    start_idx = self.hora_a_index(horario['inicio'], time_slots)
                    end_idx = self.hora_a_index(horario['fin'], time_slots)
                    
                    if start_idx is not None and end_idx is not None:
                        height = end_idx - start_idx
                        rect = patches.Rectangle(
                            (day_idx + 0.05, start_idx),
                            0.9, height,
                            facecolor=color, edgecolor='black', alpha=0.8, linewidth=1.5
                        )
                        ax.add_patch(rect)
                        
                        # Texto ajustado al tamaño del rectángulo
                        texto = f"{nombre_curso}\nGrupo {grupo['grupo']}"
                        
                        # Calcular tamaño de fuente basado en el tamaño del rectángulo
                        font_size = min(12, max(8, height * 2.5))
                        
                        # Dividir texto si es muy largo
                        if len(nombre_curso) > 25:
                            palabras = nombre_curso.split()
                            if len(palabras) > 2:
                                # Dividir en líneas más equilibradas
                                mitad = len(palabras) // 2
                                linea1 = ' '.join(palabras[:mitad])
                                linea2 = ' '.join(palabras[mitad:])
                                texto = f"{linea1}\n{linea2}\nGrupo {grupo['grupo']}"
                        
                        ax.text(
                            day_idx + 0.5,
                            start_idx + height / 2,
                            texto,
                            ha='center', va='center',
                            fontsize=font_size,
                            weight='bold',
                            wrap=True,
                            clip_on=True,
                            color='white' if sum(color[:3]) < 1.5 else 'black'
                        )
        
        # Leyenda
        handles = []
        labels = []
        for i, grupo in enumerate(combinacion):
            codigo_curso = None
            for codigo, data in self.cursos_horarios.items():
                if grupo in data.values():
                    codigo_curso = codigo
                    break
            
            if codigo_curso:
                nombre_curso = self.cursos_seleccionados[codigo_curso]['nombre']
                color = color_map[nombre_curso]
                handles.append(patches.Patch(facecolor=color, edgecolor='black'))
                
                # Abreviar nombres largos en la leyenda
                nombre_leyenda = nombre_curso
                if len(nombre_leyenda) > 35:
                    nombre_leyenda = nombre_leyenda[:32] + "..."
                
                labels.append(f"{nombre_leyenda} - Grupo {grupo['grupo']}")
        
        if handles:
            ax.legend(handles, labels, bbox_to_anchor=(0.5, -0.15), 
                     loc='upper center', ncol=2, fontsize=10)
        
        # Información adicional
        total_creditos = sum(self.cursos_seleccionados[codigo]['creditos'] 
                           for codigo in self.cursos_seleccionados.keys())
        
        ax.set_title(f'{titulo}\nTotal de Créditos: {total_creditos}', 
                    fontsize=14, weight='bold', pad=20)
        
    def hora_a_index(self, hora, time_slots):
        for idx, (start, end) in enumerate(time_slots):
            if hora == start:
                return idx
        
        # Aproximar si no coincide exactamente
        h, m = map(int, hora.split(":"))
        total = h * 60 + m
        
        for idx, (s, e) in enumerate(time_slots):
            sh, sm = map(int, s.split(":"))
            eh, em = map(int, e.split(":"))
            if total >= sh * 60 + sm and total <= eh * 60 + em:
                return idx
        return None

def main():
    root = tk.Tk()
    
    # Configurar estilo
    style = ttk.Style()
    if 'clam' in style.theme_names():
        style.theme_use('clam')
    
    app = ScheduleGeneratorApp(root)
    root.mainloop()

if __name__ == "__main__":
    main()