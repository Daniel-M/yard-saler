package yard_sale

import (
	"context"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type Repository interface {
	CreateYardSale(ctx context.Context, ys *domain.YardSale) (*domain.YardSale, error)
	FindYardSaleByID(ctx context.Context, id string) (*domain.YardSale, error)
	FindYardSaleByEventCode(ctx context.Context, eventCode string) (*domain.YardSale, error)
	ListYardSales(ctx context.Context, userID string, offset, limit int) ([]*domain.YardSale, int, error)

	CreateProduct(ctx context.Context, prod *domain.Product) (*domain.Product, error)
	FindProductByID(ctx context.Context, id string) (*domain.Product, error)
	FindProductsByYardSaleID(ctx context.Context, yardSaleID string) ([]*domain.Product, error)
	FindProductByCodes(ctx context.Context, eventCode, productCode string) (*domain.Product, error)
}
