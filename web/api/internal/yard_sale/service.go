package yard_sale

import (
	"context"
	"errors"
	"time"

	"github.com/Daniel-M/ys-api/internal/domain"
	"github.com/Daniel-M/ys-api/internal/dto"
	"github.com/oklog/ulid/v2"
)

var (
	ErrYardSaleNotFound = errors.New("yard sale not found")
	ErrProductNotFound  = errors.New("product not found")
	ErrForbidden        = errors.New("forbidden")
)

type Service struct {
	repo Repository
}

func NewService(repo Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreateYardSale(ctx context.Context, userID string, d dto.CreateYardSaleDTO) (*domain.YardSale, error) {
	eventCode := d.EventCode
	if eventCode == "" {
		eventCode = "ev-" + ulid.Make().String()
	}
	ys := &domain.YardSale{
		ID:          ulid.Make().String(),
		UserID:      userID,
		Title:       d.Title,
		Description: d.Description,
		Location:    d.Location,
		StartDate:   d.StartDate,
		EndDate:     d.EndDate,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		EventCode:   eventCode,
	}
	return s.repo.CreateYardSale(ctx, ys)
}

func (s *Service) GetYardSaleDetail(ctx context.Context, id string) (*domain.YardSale, []*domain.Product, error) {
	ys, err := s.repo.FindYardSaleByID(ctx, id)
	if err != nil {
		return nil, nil, err
	}
	if ys == nil {
		ys, err = s.repo.FindYardSaleByEventCode(ctx, id)
		if err != nil {
			return nil, nil, err
		}
		if ys == nil {
			return nil, nil, ErrYardSaleNotFound
		}
	}

	prods, err := s.repo.FindProductsByYardSaleID(ctx, ys.ID)
	if err != nil {
		return nil, nil, err
	}

	return ys, prods, nil
}

func (s *Service) GetYardSaleByEventCode(ctx context.Context, eventCode string) (*domain.YardSale, []*domain.Product, error) {
	ys, err := s.repo.FindYardSaleByEventCode(ctx, eventCode)
	if err != nil {
		return nil, nil, err
	}
	if ys == nil {
		return nil, nil, ErrYardSaleNotFound
	}

	prods, err := s.repo.FindProductsByYardSaleID(ctx, ys.ID)
	if err != nil {
		return nil, nil, err
	}

	return ys, prods, nil
}

func (s *Service) GetProductByCodes(ctx context.Context, eventCode, productCode string) (*domain.Product, error) {
	prod, err := s.repo.FindProductByCodes(ctx, eventCode, productCode)
	if err != nil {
		return nil, err
	}
	if prod == nil {
		return nil, ErrProductNotFound
	}
	return prod, nil
}

func (s *Service) ListYardSales(ctx context.Context, userID string, offset, limit int) ([]*domain.YardSale, int, error) {
	if limit <= 0 {
		limit = 10
	}
	if offset < 0 {
		offset = 0
	}
	return s.repo.ListYardSales(ctx, userID, offset, limit)
}

func (s *Service) AddProduct(ctx context.Context, userID string, yardSaleID string, d dto.CreateProductDTO) (*domain.Product, error) {
	ys, err := s.repo.FindYardSaleByID(ctx, yardSaleID)
	if err != nil {
		return nil, err
	}
	if ys == nil {
		ys, err = s.repo.FindYardSaleByEventCode(ctx, yardSaleID)
		if err != nil {
			return nil, err
		}
		if ys == nil {
			return nil, ErrYardSaleNotFound
		}
	}

	if ys.UserID != userID {
		return nil, ErrForbidden
	}

	status := d.Status
	if status == "" {
		status = "available"
	}

	productCode := d.ProductCode
	if productCode == "" {
		productCode = "prod-" + ulid.Make().String()
	}

	prod := &domain.Product{
		ID:          ulid.Make().String(),
		YardSaleID:  ys.ID,
		Name:        d.Name,
		Description: d.Description,
		Price:       d.Price,
		Condition:   d.Condition,
		Status:      status,
		Images:      d.Images,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
		ProductCode: productCode,
	}

	if prod.Images == nil {
		prod.Images = []string{}
	}

	return s.repo.CreateProduct(ctx, prod)
}

func (s *Service) UpdateProduct(ctx context.Context, userID string, yardSaleID string, productID string, d dto.CreateProductDTO) (*domain.Product, error) {
	ys, err := s.repo.FindYardSaleByID(ctx, yardSaleID)
	if err != nil {
		return nil, err
	}
	if ys == nil {
		ys, err = s.repo.FindYardSaleByEventCode(ctx, yardSaleID)
		if err != nil {
			return nil, err
		}
		if ys == nil {
			return nil, ErrYardSaleNotFound
		}
	}

	if ys.UserID != userID {
		return nil, ErrForbidden
	}

	prod, err := s.repo.FindProductByID(ctx, productID)
	if err != nil {
		return nil, err
	}
	if prod == nil {
		return nil, ErrProductNotFound
	}

	if prod.YardSaleID != ys.ID {
		return nil, ErrProductNotFound
	}

	if err := d.Validate(); err != nil {
		return nil, err
	}

	prod.Name = d.Name
	prod.Description = d.Description
	prod.Price = d.Price
	prod.Condition = d.Condition
	prod.Status = d.Status
	if d.Images != nil {
		prod.Images = d.Images
	}
	if d.ProductCode != "" {
		prod.ProductCode = d.ProductCode
	}
	prod.UpdatedAt = time.Now()

	err = s.repo.UpdateProduct(ctx, prod)
	if err != nil {
		return nil, err
	}

	return prod, nil
}


// ProjectedEarnings computes the current sold earnings and total projected earnings for a user.
func (s *Service) ProjectedEarnings(ctx context.Context, userID string) (dto.ProjectedEarningsDTO, error) {
	currentSold, projectedSold, err := s.repo.GetProjectedEarnings(ctx, userID)
	if err != nil {
		return dto.ProjectedEarningsDTO{}, err
	}
	return dto.ProjectedEarningsDTO{
		CurrentSold:       currentSold,
		ProjectedSold:     projectedSold,
		ProjectedEarnings: currentSold,
		Target:            projectedSold,
	}, nil
}
