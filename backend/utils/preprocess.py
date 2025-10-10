import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from joblib import dump, load
import os

class Preprocessor:
    def __init__(self, rolling_window=3, scaler_path="scaler.joblib"):
        """
        Preprocessor for ML features.
        
        Args:
            rolling_window (int): Window size for rolling stats.
            scaler_path (str): Path to save/load StandardScaler.
        """
        self.rolling_window = rolling_window
        self.scaler_path = scaler_path
        self.scaler = None
        self.numeric_cols = None

    def fit_scaler(self, df):
        """Fit scaler on numeric columns and save it."""
        self.numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        self.scaler = StandardScaler()
        self.scaler.fit(df[self.numeric_cols])
        dump(self.scaler, self.scaler_path)

    def load_scaler(self):
        """Load scaler from disk if exists."""
        if os.path.exists(self.scaler_path):
            self.scaler = load(self.scaler_path)
        else:
            raise FileNotFoundError("Scaler file not found. Run fit_scaler first.")

    def add_features(self, df):
        """Add rolling mean, std, diff for numeric columns."""
        new_features = {}
        numeric_cols = df.select_dtypes(include=[np.number]).columns

        for col in numeric_cols:
            series = df[col]
            new_features[f"{col}_mean"] = series.rolling(window=self.rolling_window, min_periods=1).mean()
            new_features[f"{col}_std"] = series.rolling(window=self.rolling_window, min_periods=1).std().fillna(0)
            new_features[f"{col}_diff"] = series.diff().fillna(0)

        df_feat = pd.concat([df, pd.DataFrame(new_features, index=df.index)], axis=1)
        df_feat.fillna(0, inplace=True)
        return df_feat

    def scale_features(self, df):
        """Scale numeric columns using StandardScaler."""
        if self.scaler is None:
            self.load_scaler()
        df[self.numeric_cols] = self.scaler.transform(df[self.numeric_cols])
        return df

    def transform(self, df, fit_scaler=False):
        """
        Full preprocessing pipeline.
        
        Args:
            df (pd.DataFrame): Input dataframe.
            fit_scaler (bool): Whether to fit scaler on this data.
        
        Returns:
            pd.DataFrame: Preprocessed dataframe.
        """
        df_feat = self.add_features(df)

        if fit_scaler:
            self.fit_scaler(df_feat)

        df_feat = self.scale_features(df_feat)
        return df_feat


# Example usage
if __name__ == "__main__":
    df = pd.read_csv("data/water_data.csv")

    preprocessor = Preprocessor(rolling_window=3)
    
    # First time: fit scaler
    df_processed = preprocessor.transform(df, fit_scaler=True)
    print(df_processed.head())

    # Later: just transform using saved scaler
    # preprocessor.load_scaler()
    # df_processed = preprocessor.transform(new_df)
