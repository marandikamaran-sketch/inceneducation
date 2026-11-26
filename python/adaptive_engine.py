"""
EduVision AR Pro - Python Adaptive Learning Engine (SD Kelas 1-6)
Dijalankan langsung di browser melalui Pyodide (WebAssembly).
Menangani pembangkitan soal adaptif (Matematika, IPA, Bahasa Inggris, Klasifikasi)
serta Dynamic Difficulty Adjustment (DDA).
"""

import json
import random
from typing import Dict, List, Any


class AdaptiveLearningEngine:
    """Mesin pedagogi adaptif untuk siswa Sekolah Dasar kelas 1 hingga 6."""

    def __init__(self) -> None:
        self.difficulty: int = 1  # Level 1 (Mudah) sampai 5 (Tantangan)
        self.streak: int = 0
        self.total_answered: int = 0
        self.total_correct: int = 0
        self.history: List[Dict[str, Any]] = []
        self.logs: List[str] = ["[INIT] EduVision Python Adaptive Engine siap."]

    def _log(self, msg: str) -> None:
        self.logs.append(msg)
        if len(self.logs) > 40:
            self.logs = self.logs[-40:]

    def reset_session(self) -> str:
        """Mengatur ulang streak dan level kesulitan ke awal."""
        self.difficulty = 1
        self.streak = 0
        self._log("[RESET] Sesi adaptif direset ke Level 1.")
        return json.dumps({"status": "ok", "difficulty": self.difficulty})

    def evaluate_answer(self, is_correct: bool, subject: str, response_time_ms: int = 3000) -> str:
        """
        Mengevaluasi jawaban siswa dan menyesuaikan level kesulitan secara otomatis (DDA).
        """
        self.total_answered += 1
        old_diff = self.difficulty

        if is_correct:
            self.total_correct += 1
            self.streak += 1
            # Naikkan kesulitan jika benar 2 kali berturut-turut dan cepat
            if self.streak >= 2 and self.difficulty < 5:
                self.difficulty += 1
                self.streak = 0
                self._log(f"[DDA UP] Akurasi tinggi! Level naik {old_diff} -> {self.difficulty}")
            else:
                self._log(f"[OK] Jawaban benar ({subject}, {response_time_ms}ms). Streak: {self.streak}")
        else:
            self.streak = 0
            if self.difficulty > 1:
                self.difficulty -= 1
                self._log(f"[DDA DOWN] Perlu penguatan. Level turun {old_diff} -> {self.difficulty}")
            else:
                self._log(f"[RETRY] Jawaban belum tepat ({subject}). Tetap di Level 1.")

        self.history.append({
            "subject": subject,
            "correct": is_correct,
            "difficulty": self.difficulty,
            "time_ms": response_time_ms
        })

        accuracy = round((self.total_correct / self.total_answered) * 100) if self.total_answered else 0
        return json.dumps({
            "difficulty": self.difficulty,
            "streak": self.streak,
            "accuracy": accuracy,
            "level_changed": old_diff != self.difficulty,
            "direction": "up" if self.difficulty > old_diff else ("down" if self.difficulty < old_diff else "same")
        })

    def get_stats(self) -> str:
        """Mengembalikan statistik mesin dan log terbaru untuk Inspektor Python."""
        accuracy = round((self.total_correct / self.total_answered) * 100) if self.total_answered else 0
        return json.dumps({
            "difficulty": self.difficulty,
            "streak": self.streak,
            "total_answered": self.total_answered,
            "total_correct": self.total_correct,
            "accuracy": accuracy,
            "logs": self.logs[-15:]
        })

    def _gen_math(self, grade_group: str) -> Dict[str, Any]:
        d = self.difficulty
        if grade_group == "1-2":
            if random.random() < 0.65:
                a = random.randint(1 + d, 6 + d * 3)
                b = random.randint(1, 5 + d * 2)
                ans = a + b
                q_text = f"Berapakah hasil dari {a} + {b} ?"
                hint = f"Mulai dari angka {a}, lalu hitung maju sebanyak {b} langkah."
                explain = f"Hebat! {a} ditambah {b} sama dengan {ans}."
            else:
                b = random.randint(1, 5 + d)
                ans = random.randint(1, 6 + d * 2)
                a = ans + b
                q_text = f"Berapakah hasil dari {a} - {b} ?"
                hint = f"Dari angka {a}, hitung mundur sebanyak {b} langkah."
                explain = f"Benar! {a} dikurangi {b} sama dengan {ans}."
        elif grade_group == "3-4":
            op = random.choice(["x", ":", "+", "-"])
            if op == "x":
                a = random.randint(2, 5 + d)
                b = random.randint(2, 6 + d)
                ans = a * b
                q_text = f"Berapakah hasil dari {a} × {b} ?"
                hint = f"Perkalian adalah penjumlahan berulang: {a} dijumlahkan sebanyak {b} kali."
                explain = f"Tepat! {a} × {b} = {ans}."
            elif op == ":":
                b = random.randint(2, 5 + d)
                ans = random.randint(2, 6 + d)
                a = b * ans
                q_text = f"Berapakah hasil dari {a} ÷ {b} ?"
                hint = f"Cari angka yang jika dikalikan {b} hasilnya {a}."
                explain = f"Keren! {a} dibagi {b} sama dengan {ans}."
            elif op == "+":
                a = random.randint(15, 40 + d * 15)
                b = random.randint(12, 35 + d * 10)
                ans = a + b
                q_text = f"Hitunglah: {a} + {b} = ?"
                hint = "Jumlahkan angka satuannya dulu, lalu angka puluhannya."
                explain = f"Bagus sekali! {a} + {b} = {ans}."
            else:
                a = random.randint(40, 80 + d * 15)
                b = random.randint(12, 35)
                ans = a - b
                q_text = f"Hitunglah: {a} - {b} = ?"
                hint = "Kurangkan satuan dengan satuan, lalu puluhan dengan puluhan."
                explain = f"Tepat! {a} - {b} = {ans}."
        else:  # Kelas 5-6
            kind = random.choice(["algebra", "percent", "area", "mixed"])
            if kind == "algebra":
                x = random.randint(3, 8 + d * 2)
                k = random.randint(2, 5)
                c = random.randint(4, 15)
                rhs = k * x + c
                ans = x
                q_text = f"Jika {k} × n + {c} = {rhs}, berapakah nilai n?"
                hint = f"Kurangkan {rhs} dengan {c} terlebih dahulu, lalu bagi dengan {k}."
                explain = f"Mantap! ({rhs} - {c}) ÷ {k} = {ans}."
            elif kind == "percent":
                pct = random.choice([10, 20, 25, 50])
                base = random.choice([40, 60, 80, 100, 120, 200])
                ans = (pct * base) // 100
                q_text = f"Berapakah {pct}% dari {base} ?"
                hint = f"{pct}% berarti {pct}/100. Kalikan dengan {base}."
                explain = f"Brilian! {pct}% dari {base} adalah {ans}."
            elif kind == "area":
                p = random.randint(4, 9 + d)
                l = random.randint(3, 7 + d)
                ans = p * l
                q_text = f"Luas persegi panjang dengan panjang {p} cm dan lebar {l} cm adalah?"
                hint = "Rumus luas persegi panjang = panjang × lebar."
                explain = f"Tepat! Luas = {p} × {l} = {ans} cm²."
            else:
                a = random.randint(4, 8 + d)
                b = random.randint(3, 7)
                c = random.randint(5, 18)
                ans = a * b + c
                q_text = f"Hitunglah: ({a} × {b}) + {c} = ?"
                hint = "Kerjakan perkalian di dalam tanda kurung terlebih dahulu."
                explain = f"Benar! {a * b} + {c} = {ans}."

        distractors = set()
        offsets = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 10, -10]
        random.shuffle(offsets)
        for off in offsets:
            cand = ans + off
            if cand >= 0 and cand != ans:
                distractors.add(cand)
            if len(distractors) == 3:
                break

        options = [{"label": str(ans), "emoji": "🔢", "correct": True}]
        for dist in distractors:
            options.append({"label": str(dist), "emoji": "✨", "correct": False})
        random.shuffle(options)

        return {
            "mode": "quiz",
            "subject": "Matematika",
            "grade": grade_group,
            "difficulty": d,
            "question": q_text,
            "hint": hint,
            "explanation": explain,
            "options": options
        }

    def _gen_ipa(self, grade_group: str) -> Dict[str, Any]:
        bank = {
            "1-2": [
                ("Hewan manakah yang hidup di air?", "Ikan", "🐟", [("Kucing", "🐱"), ("Ayam", "🐔"), ("Kelinci", "🐰")],
                 "Hewan ini bernapas dengan insang dan berenang dengan sirip.", "Ikan hidup di air dan bernapas menggunakan insang."),
                ("Bagian tumbuhan yang berfungsi menyerap air dari tanah adalah?", "Akar", "🌱", [("Daun", "🍃"), ("Bunga", "🌸"), ("Buah", "🍎")],
                 "Bagian ini berada di dalam tanah.", "Akar menyerap air dan mineral dari dalam tanah."),
                ("Hewan manakah yang berkembang biak dengan bertelur?", "Ayam", "🐔", [("Sapi", "🐄"), ("Kambing", "🐐"), ("Kucing", "🐱")],
                 "Hewan ini memiliki sayap dan menghasilkan telur.", "Ayam adalah unggas yang berkembang biak dengan cara bertelur."),
                ("Indra yang kita gunakan untuk mendengar suara musik adalah?", "Telinga", "👂", [("Mata", "👁️"), ("Hidung", "👃"), ("Lidah", "👅")],
                 "Terletak di sisi kanan dan kiri kepala kita.", "Telinga adalah indra pendengaran manusia.")
            ],
            "3-4": [
                ("Proses pembuatan makanan pada tumbuhan hijau dengan bantuan cahaya matahari disebut?", "Fotosintesis", "☀️", [("Respirasi", "💨"), ("Metamorfosis", "🦋"), ("Penguapan", "💧")],
                 "Melibatkan klorofil di daun dan sinar matahari.", "Fotosintesis mengubah air dan CO₂ menjadi makanan dengan bantuan cahaya matahari."),
                ("Hewan pemakan tumbuhan saja disebut?", "Herbivora", "🦒", [("Karnivora", "🦁"), ("Omnivora", "🐻"), ("Insektivora", "🐸")],
                 "Contohnya sapi, kelinci, dan jerapah.", "Herbivora adalah kelompok hewan pemakan tumbuhan."),
                ("Perubahan wujud dari benda cair menjadi gas disebut?", "Menguap", "💨", [("Mencair", "🧊"), ("Membeku", "❄️"), ("Menyublim", "🌫️")],
                 "Terjadi saat air direbus hingga mendidih.", "Menguap adalah perubahan wujud cair menjadi gas karena pemanasan."),
                ("Sumber energi panas dan cahaya terbesar bagi Bumi adalah?", "Matahari", "☀️", [("Bulan", "🌙"), ("Bintang", "⭐"), ("Listrik", "⚡")],
                 "Terbit di timur dan menyinari Bumi setiap siang.", "Matahari adalah pusat tata surya dan sumber energi utama Bumi.")
            ],
            "5-6": [
                ("Planet terbesar di dalam Tata Surya kita adalah?", "Jupiter", "🪐", [("Mars", "🔴"), ("Bumi", "🌍"), ("Venus", "🌕")],
                 "Planet gas raksasa urutan kelima dari Matahari.", "Jupiter adalah planet terbesar di Tata Surya."),
                ("Organ tubuh manusia yang berfungsi memompa darah ke seluruh tubuh adalah?", "Jantung", "❤️", [("Paru-paru", "🫁"), ("Lambung", "🩺"), ("Ginjal", "🧬")],
                 "Organ ini berdetak terus-menerus di rongga dada kiri.", "Jantung memompa darah kaya oksigen ke seluruh tubuh."),
                ("Perpindahan panas melalui zat perantara tanpa diikuti perpindahan partikel zatnya disebut?", "Konduksi", "🔥", [("Konveksi", "🌊"), ("Radiasi", "☀️"), ("Isolasi", "🧱")],
                 "Contohnya sendok logam yang terasa panas saat mengaduk teh panas.", "Konduksi adalah perpindahan kalor melalui zat padat seperti logam."),
                ("Planet yang dijuluki sebagai Planet Merah adalah?", "Mars", "🔴", [("Merkurius", "🪨"), ("Saturnus", "🪐"), ("Neptunus", "🔵")],
                 "Permukaannya kaya akan oksida besi berwarna kemerahan.", "Mars dijuluki Planet Merah karena warna permukaannya.")
            ]
        }
        q_text, ans, ans_em, wrongs, hint, explain = random.choice(bank[grade_group])
        options = [{"label": ans, "emoji": ans_em, "correct": True}]
        for w_lbl, w_em in wrongs:
            options.append({"label": w_lbl, "emoji": w_em, "correct": False})
        random.shuffle(options)
        return {
            "mode": "quiz",
            "subject": "IPA",
            "grade": grade_group,
            "difficulty": self.difficulty,
            "question": q_text,
            "hint": hint,
            "explanation": explain,
            "options": options
        }

    def _gen_english(self, grade_group: str) -> Dict[str, Any]:
        bank = {
            "1-2": [
                ("Apa bahasa Inggris dari 'Apel'?", "Apple", "🍎", [("Banana", "🍌"), ("Cat", "🐱"), ("Book", "📘")],
                 "Diawali huruf A dan buah berwarna merah/hijau.", "'Apple' artinya Apel!"),
                ("Apa arti kata 'Sun' dalam bahasa Indonesia?", "Matahari", "☀️", [("Bulan", "🌙"), ("Bintang", "⭐"), ("Awan", "☁️")],
                 "Benda langit yang bersinar terang di siang hari.", "'Sun' artinya Matahari."),
                ("Pilih bahasa Inggris dari warna 'Biru'!", "Blue", "🔵", [("Red", "🔴"), ("Green", "🟢"), ("Yellow", "🟡")],
                 "Warna langit cerah dan lautan.", "'Blue' berarti Biru."),
                ("Hewan 'Cat' dalam bahasa Indonesia adalah?", "Kucing", "🐱", [("Anjing", "🐶"), ("Burung", "🐦"), ("Ikan", "🐟")],
                 "Hewan peliharaan yang suka mengeong.", "'Cat' artinya Kucing.")
            ],
            "3-4": [
                ("Lengkapi kalimat: 'I ___ to school every morning.'", "go", "🏫", [("eat", "🍽️"), ("sleep", "😴"), ("fly", "✈️")],
                 "Kata kerja yang artinya 'pergi'.", "'I go to school' artinya Saya pergi ke sekolah."),
                ("Apa arti kata 'Library' dalam bahasa Indonesia?", "Perpustakaan", "📚", [("Kantin", "🍱"), ("Lapangan", "⚽"), ("Rumah Sakit", "🏥")],
                 "Tempat kita membaca dan meminjam banyak buku.", "'Library' artinya Perpustakaan."),
                ("Lawan kata (opposite) dari 'Big' adalah?", "Small", "🐜", [("Tall", "🦒"), ("Fast", "⚡"), ("Hot", "🔥")],
                 "Big artinya besar, lawannya adalah kecil.", "'Small' adalah lawan kata dari 'Big'."),
                ("Apa bahasa Inggris dari 'Papan Tulis'?", "Whiteboard", "📋", [("Window", "🪟"), ("Chair", "🪑"), ("Pencil", "✏️")],
                 "Tempat guru menulis materi di depan kelas.", "'Whiteboard' artinya Papan Tulis.")
            ],
            "5-6": [
                ("Bentuk lampau (Past Tense) dari kata 'Eat' adalah?", "Ate", "🍽️", [("Eated", "❌"), ("Eating", "⏳"), ("Eats", "🍴")],
                 "Kata kerja tidak beraturan (irregular verb), terdiri dari 3 huruf.", "Bentuk Past Tense dari 'eat' adalah 'ate'."),
                ("Sinonim (persamaan arti) dari kata 'Happy' adalah?", "Glad", "😄", [("Sad", "😢"), ("Angry", "😠"), ("Tired", "🥱")],
                 "Menunjukkan perasaan senang atau gembira.", "'Glad' memiliki arti yang sama dengan 'Happy'."),
                ("Lengkapi: 'She ___ reading a science book right now.'", "is", "📖", [("are", "👥"), ("am", "🙋"), ("were", "🕰️")],
                 "Subjek tunggal 'She' berpasangan dengan to-be Present Continuous.", "Untuk subjek 'She', kita menggunakan 'is'."),
                ("Apa arti kata 'Environment' dalam bahasa Indonesia?", "Lingkungan", "🌍", [("Peralatan", "🛠️"), ("Pelajaran", "📝"), ("Perjalanan", "🧭")],
                 "Berkaitan dengan alam sekitar kita.", "'Environment' artinya Lingkungan.")
            ]
        }
        q_text, ans, ans_em, wrongs, hint, explain = random.choice(bank[grade_group])
        options = [{"label": ans, "emoji": ans_em, "correct": True}]
        for w_lbl, w_em in wrongs:
            options.append({"label": w_lbl, "emoji": w_em, "correct": False})
        random.shuffle(options)
        return {
            "mode": "quiz",
            "subject": "Bahasa Inggris",
            "grade": grade_group,
            "difficulty": self.difficulty,
            "question": q_text,
            "hint": hint,
            "explanation": explain,
            "options": options
        }

    def generate_classify_round(self, grade_group: str) -> Dict[str, Any]:
        """Menghasilkan ronde Mode Klasifikasi (Portal Kiri vs Portal Kanan)."""
        sets = {
            "1-2": [
                ("Bilangan Genap", "Bilangan Ganjil", "Pilah angka ke Portal Genap (Kiri) atau Ganjil (Kanan)!",
                 [("2", "🔢", "left"), ("4", "🔢", "left"), ("3", "✨", "right"), ("7", "✨", "right")],
                 "Bilangan genap bisa dibagi 2 tanpa sisa (2, 4, 6, 8)."),
                ("Hewan Darat", "Hewan Air", "Masukkan hewan ke habitatnya: Darat (Kiri) atau Air (Kanan)!",
                 [("Kucing", "🐱", "left"), ("Gajah", "🐘", "left"), ("Ikan", "🐟", "right"), ("Paus", "🐋", "right")],
                 "Perhatikan apakah hewan itu berjalan di tanah atau berenang di laut.")
            ],
            "3-4": [
                ("Herbivora", "Karnivora", "Kelompokkan hewan Pemakan Tumbuhan (Kiri) vs Pemakan Daging (Kanan)!",
                 [("Sapi", "🐄", "left"), ("Kelinci", "🐰", "left"), ("Singa", "🦁", "right"), ("Elang", "🦅", "right")],
                 "Herbivora makan rumput/daun, Karnivora berburu daging."),
                ("Benda Padat", "Benda Cair", "Pilah wujud benda: Padat (Kiri) vs Cair (Kanan)!",
                 [("Batu", "🪨", "left"), ("Kayu", "🪵", "left"), ("Air", "💧", "right"), ("Minyak", "🫗", "right")],
                 "Benda cair mengalir dan mengikuti bentuk wadahnya.")
            ],
            "5-6": [
                ("Bilangan Prima", "Bukan Prima", "Pilah Bilangan Prima (Kiri) vs Bukan Prima (Kanan)!",
                 [("7", "💎", "left"), ("11", "💎", "left"), ("9", "🔷", "right"), ("12", "🔷", "right")],
                 "Bilangan prima hanya bisa dibagi 1 dan dirinya sendiri."),
                ("Energi Terbarukan", "Energi Fosil", "Pilah sumber energi: Terbarukan (Kiri) vs Fosil (Kanan)!",
                 [("Surya", "☀️", "left"), ("Angin", "🌬️", "left"), ("Batu Bara", "🪨", "right"), ("Minyak Bumi", "🛢️", "right")],
                 "Energi terbarukan berasal dari alam yang tidak cepat habis.")
            ]
        }
        left_cat, right_cat, prompt, items_raw, hint = random.choice(sets[grade_group])
        items = [
            {"label": lbl, "emoji": em, "target": tgt}
            for lbl, em, tgt in items_raw
        ]
        random.shuffle(items)
        self._log(f"[GEN] Klasifikasi ({grade_group}): {left_cat} vs {right_cat}")
        return {
            "mode": "classify",
            "subject": "Klasifikasi",
            "grade": grade_group,
            "difficulty": self.difficulty,
            "question": prompt,
            "leftCategory": left_cat,
            "rightCategory": right_cat,
            "hint": hint,
            "explanation": f"Luar biasa! Kamu berhasil memilah {left_cat} dan {right_cat} dengan tepat.",
            "items": items
        }

    def generate_question(self, grade_group: str = "1-2", subject: str = "campuran", game_mode: str = "single") -> str:
        """API utama yang dipanggil JavaScript untuk membuat soal baru."""
        if game_mode == "classify":
            data = self.generate_classify_round(grade_group)
            return json.dumps(data, ensure_ascii=False)

        chosen = subject
        if subject == "campuran":
            chosen = random.choice(["matematika", "ipa", "inggris"])

        if chosen == "matematika":
            data = self._gen_math(grade_group)
        elif chosen == "ipa":
            data = self._gen_ipa(grade_group)
        else:
            data = self._gen_english(grade_group)

        self._log(f"[GEN] Soal {data['subject']} (Kelas {grade_group}, Lvl {self.difficulty})")
        return json.dumps(data, ensure_ascii=False)


# Instance global untuk dipanggil langsung oleh Pyodide JS Bridge
engine = AdaptiveLearningEngine()


def generate_question(grade_group: str = "1-2", subject: str = "campuran", game_mode: str = "single") -> str:
    return engine.generate_question(grade_group, subject, game_mode)


def evaluate_answer(is_correct: bool, subject: str, response_time_ms: int = 3000) -> str:
    return engine.evaluate_answer(is_correct, subject, response_time_ms)


def get_engine_stats() -> str:
    return engine.get_stats()


def reset_engine() -> str:
    return engine.reset_session()
