package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

type SecurityConfig struct {
	Pepper string `mapstructure:"pepper"`
}

type AuthConfig struct {
	PasetoKey string        `mapstructure:"paseto_key"`
	TokenTTL  time.Duration `mapstructure:"token_ttl"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
}

type DatabaseConfig struct {
	Driver string `mapstructure:"driver"`
}

type Config struct {
	Security SecurityConfig `mapstructure:"security"`
	Auth     AuthConfig     `mapstructure:"auth"`
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
}

// LoadConfig reads configuration from a config.toml file or environment variables.
func LoadConfig(path string) (*Config, error) {
	v := viper.New()

	v.SetDefault("server.port", "8080")
	v.SetDefault("database.driver", "sqlite3")
	v.SetDefault("auth.token_ttl", time.Hour)

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

	if config.Security.Pepper == "" {
		return nil, fmt.Errorf("security.pepper is required but was empty")
	}
	if config.Auth.PasetoKey == "" {
		return nil, fmt.Errorf("auth.paseto_key is required but was empty")
	}

	return &config, nil
}
