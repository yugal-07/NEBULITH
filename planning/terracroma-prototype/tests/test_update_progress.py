import tempfile
import unittest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
import update_progress

class ProgressTests(unittest.TestCase):
    def make_root(self, docs):
        td = tempfile.TemporaryDirectory()
        root = Path(td.name)
        (root / "plan").mkdir()
        (root / "progress" / "per-file-status").mkdir(parents=True)
        for name, content in docs.items():
            (root / "plan" / name).write_text(content, encoding="utf-8")
        return td, root

    def test_checkbox_percentage_and_zero_tasks(self):
        td, root = self.make_root({
            "00.md": "# A\n## Tasks\n- [x] [TASK:A-001] A\n- [ ] [TASK:A-002] B\n## Dependencies\n- None\n## Status\n**Status:** Not started\n",
            "01.md": "# B\n## Tasks\n## Dependencies\n- `00.md`\n## Status\n**Status:** Not started\n"})
        try:
            payload, errors = update_progress.calculate(root)
            self.assertFalse(errors)
            self.assertEqual(payload["checked_tasks"], 1)
            self.assertEqual(payload["total_tasks"], 2)
            self.assertEqual(payload["percentage"], 50.0)
            self.assertNotEqual(payload["states"]["01.md"], "Done")
        finally: td.cleanup()

    def test_done_is_blocked_until_dependencies_are_done(self):
        td, root = self.make_root({
            "00.md": "# A\n## Tasks\n- [ ] [TASK:A-001] A\n## Dependencies\n- None\n## Status\n**Status:** Not started\n",
            "01.md": "# B\n## Tasks\n- [x] [TASK:B-001] B\n## Dependencies\n- `00.md`\n## Status\n**Status:** Not started\n"})
        try:
            payload, errors = update_progress.calculate(root)
            self.assertFalse(errors)
            self.assertEqual(payload["states"]["01.md"], "In progress")
        finally: td.cleanup()

    def test_dependency_cycle_is_error(self):
        td, root = self.make_root({
            "00.md": "# A\n## Tasks\n- [ ] [TASK:A-001] A\n## Dependencies\n- `01.md`\n",
            "01.md": "# B\n## Tasks\n- [ ] [TASK:B-001] B\n## Dependencies\n- `00.md`\n"})
        try:
            _, errors = update_progress.calculate(root)
            self.assertTrue(any("Dependency cycle" in e for e in errors))
        finally: td.cleanup()

    def test_missing_dependency_is_error(self):
        td, root = self.make_root({"00.md": "# A\n## Tasks\n- [x] [TASK:A-001] A\n## Dependencies\n- `missing.md`\n"})
        try:
            _, errors = update_progress.calculate(root)
            self.assertTrue(any("Missing dependency" in e for e in errors))
        finally: td.cleanup()

    def test_duplicate_ids_are_error(self):
        td, root = self.make_root({
            "00.md": "# A\n## Tasks\n- [ ] [TASK:DUP-001] A\n",
            "01.md": "# B\n## Tasks\n- [ ] [TASK:DUP-001] B\n"})
        try:
            _, errors = update_progress.calculate(root)
            self.assertTrue(any("Duplicate task ID" in e for e in errors))
        finally: td.cleanup()

    def test_log_is_idempotent_and_append_only_on_uncheck(self):
        td, root = self.make_root({"00.md": "# A\n## Tasks\n- [x] [TASK:A-001] A\n## Dependencies\n- None\n## Status\n**Status:** Not started\n"})
        try:
            update_progress.update(root)
            log = root / "progress" / "completed-log.md"
            first = log.read_text(encoding="utf-8")
            update_progress.update(root)
            self.assertEqual(first, log.read_text(encoding="utf-8"))
            plan = root / "plan" / "00.md"
            plan.write_text(plan.read_text().replace("[x]", "[ ]"), encoding="utf-8")
            update_progress.update(root)
            reopened = log.read_text(encoding="utf-8")
            self.assertIn("[TASK:A-001]", reopened)
            self.assertEqual(reopened.count("[TASK:A-001]"), 1)
        finally: td.cleanup()

if __name__ == "__main__": unittest.main()
