
import sys
import io
import contextlib
import pandas as pd
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns
import base64
import os
import uuid

# Force non-interactive backend
matplotlib.use('Agg')

class AnalysisService:
    def __init__(self):
        # Create a directory for served static images
        self.static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static/plots")
        os.makedirs(self.static_dir, exist_ok=True)

    def execute_code(self, code_str: str, context: dict = None):
        """
        Executes the provided python code string.
        Context can contain mapped variables (like loaded dataframes).
        Returns a dict with stdout, stderr, and list of image paths.
        """
        # Capture stdout
        old_stdout = sys.stdout
        redirected_output = io.StringIO()
        sys.stdout = redirected_output
        
        # Prepare execution environment
        exec_globals = {
            "pd": pd,
            "plt": plt,
            "sns": sns,
        }
        if context:
            exec_globals.update(context)
            
        # We wrap execution to handle plots
        images = []
        
        try:
            # Clear previous plots
            plt.clf()
            
            # Execute
            exec(code_str, exec_globals)
            
            # Check if any plot was created
            if plt.get_fignums():
                filename = f"{uuid.uuid4()}.png"
                filepath = os.path.join(self.static_dir, filename)
                plt.savefig(filepath)
                images.append(f"/static/plots/{filename}")
                plt.close()
                
        except Exception as e:
            return {
                "stdout": redirected_output.getvalue(),
                "stderr": str(e),
                "images": []
            }
        finally:
            sys.stdout = old_stdout

        return {
            "stdout": redirected_output.getvalue(),
            "stderr": "",
            "images": images
        }

analysis_service = AnalysisService()
