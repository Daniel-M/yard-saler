package config

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type SecurityConfig struct {
	Pepper string `mapstructure:"pepper"`
}

type AuthConfig struct {
	PasetoKey      string        `mapstructure:"paseto_key"`
	TokenTTL       time.Duration `mapstructure:"token_ttl"`
	GoogleClientID string        `mapstructure:"google_client_id"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
}

type DatabaseConfig struct {
	Driver string `mapstructure:"driver"`
}

type CORSConfig struct {
	AllowedOrigins []string `mapstructure:"allowed_origins"`
}

type LoggingConfig struct {
	Level string `mapstructure:"level"`
}

type Config struct {
	Security SecurityConfig `mapstructure:"security"`
	Auth     AuthConfig     `mapstructure:"auth"`
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	CORS     CORSConfig     `mapstructure:"cors"`
	Logging  LoggingConfig  `mapstructure:"logging"`
}

// LoadConfig reads configuration from a config.toml file or environment variables.
func LoadConfig(path string) (*Config, error) {
	v := viper.New()

	v.SetDefault("server.port", "8080")
	v.SetDefault("database.driver", "sqlite3")
	v.SetDefault("auth.token_ttl", time.Hour)
	v.SetDefault("logging.level", "debug")

	v.AddConfigPath(path)
	v.SetConfigName("config")
	v.SetConfigType("toml")

	v.SetEnvPrefix("APP")
	v.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	v.AutomaticEnv()

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
	}

	var config Config
	if err := v.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	if googleClientID := os.Getenv("GOOGLE_CLIENT_ID"); googleClientID != "" {
		config.Auth.GoogleClientID = googleClientID
	}

	if envVal := os.Getenv("APP_CORS_ALLOWED_ORIGINS"); envVal != "" {
		origins := strings.Split(envVal, ",")
		for i, o := range origins {
			origins[i] = strings.TrimSpace(o)
		}
		config.CORS.AllowedOrigins = origins
	}

	if config.Security.Pepper == "" {
		return nil, fmt.Errorf("security.pepper is required but was empty")
	}
	if config.Auth.PasetoKey == "" {
		return nil, fmt.Errorf("auth.paseto_key is required but was empty")
	}

	return &config, nil
}
