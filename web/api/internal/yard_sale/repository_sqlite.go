package yard_sale

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"

	"github.com/Daniel-M/ys-api/internal/domain"
)

type SqliteRepository struct {
	db *sql.DB
}

func NewSqliteRepository(db *sql.DB) *SqliteRepository {
	return &SqliteRepository{db: db}
}

func (r *SqliteRepository) CreateYardSale(ctx context.Context, ys *domain.YardSale) (*domain.YardSale, error) {
	query := `
		INSERT INTO yard_sales (id, user_id, title, description, location, start_date, end_date, created_at, updated_at, event_code)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(
		ctx, query,
		ys.ID, ys.UserID, ys.Title, ys.Description, ys.Location, ys.StartDate, ys.EndDate, ys.CreatedAt, ys.UpdatedAt, ys.EventCode,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert yard sale: %w", err)
	}
	return ys, nil
}

func (r *SqliteRepository) FindYardSaleByID(ctx context.Context, id string) (*domain.YardSale, error) {
	query := `
		SELECT id, user_id, title, description, location, start_date, end_date, created_at, updated_at, event_code
		FROM yard_sales
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var ys domain.YardSale
	var eventCode sql.NullString
	err := row.Scan(
		&ys.ID, &ys.UserID, &ys.Title, &ys.Description, &ys.Location, &ys.StartDate, &ys.EndDate, &ys.CreatedAt, &ys.UpdatedAt, &eventCode,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch yard sale: %w", err)
	}
	if eventCode.Valid {
		ys.EventCode = eventCode.String
	}
	return &ys, nil
}

func (r *SqliteRepository) FindYardSaleByEventCode(ctx context.Context, eventCode string) (*domain.YardSale, error) {
	query := `
		SELECT id, user_id, title, description, location, start_date, end_date, created_at, updated_at, event_code
		FROM yard_sales
		WHERE event_code = ? OR id = ?
	`
	row := r.db.QueryRowContext(ctx, query, eventCode, eventCode)
	var ys domain.YardSale
	var evCode sql.NullString
	err := row.Scan(
		&ys.ID, &ys.UserID, &ys.Title, &ys.Description, &ys.Location, &ys.StartDate, &ys.EndDate, &ys.CreatedAt, &ys.UpdatedAt, &evCode,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch yard sale by event code: %w", err)
	}
	if evCode.Valid {
		ys.EventCode = evCode.String
	}
	return &ys, nil
}

func (r *SqliteRepository) ListYardSales(ctx context.Context, userID string, offset, limit int) ([]*domain.YardSale, int, error) {
	var countQuery string
	var query string
	var args []interface{}
	var countArgs []interface{}

	if userID != "" {
		countQuery = `SELECT COUNT(*) FROM yard_sales WHERE user_id = ?`
		countArgs = append(countArgs, userID)
		query = `
			SELECT id, user_id, title, description, location, start_date, end_date, created_at, updated_at, event_code
			FROM yard_sales
			WHERE user_id = ?
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?
		`
		args = append(args, userID, limit, offset)
	} else {
		countQuery = `SELECT COUNT(*) FROM yard_sales`
		query = `
			SELECT id, user_id, title, description, location, start_date, end_date, created_at, updated_at, event_code
			FROM yard_sales
			ORDER BY created_at DESC
			LIMIT ? OFFSET ?
		`
		args = append(args, limit, offset)
	}

	var total int
	if err := r.db.QueryRowContext(ctx, countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count yard sales: %w", err)
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query yard sales: %w", err)
	}
	defer rows.Close()

	var list []*domain.YardSale
	for rows.Next() {
		var ys domain.YardSale
		var eventCode sql.NullString
		err := rows.Scan(
			&ys.ID, &ys.UserID, &ys.Title, &ys.Description, &ys.Location, &ys.StartDate, &ys.EndDate, &ys.CreatedAt, &ys.UpdatedAt, &eventCode,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to scan yard sale: %w", err)
		}
		if eventCode.Valid {
			ys.EventCode = eventCode.String
		}
		list = append(list, &ys)
	}
	return list, total, nil
}

func (r *SqliteRepository) CreateProduct(ctx context.Context, prod *domain.Product) (*domain.Product, error) {
	imagesJSON, err := json.Marshal(prod.Images)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal images: %w", err)
	}

	query := `
		INSERT INTO products (id, yard_sale_id, name, description, price, condition, status, images, created_at, updated_at, product_code)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	_, err = r.db.ExecContext(
		ctx, query,
		prod.ID, prod.YardSaleID, prod.Name, prod.Description, prod.Price, prod.Condition, prod.Status, string(imagesJSON), prod.CreatedAt, prod.UpdatedAt, prod.ProductCode,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to insert product: %w", err)
	}
	return prod, nil
}

func (r *SqliteRepository) FindProductByID(ctx context.Context, id string) (*domain.Product, error) {
	query := `
		SELECT id, yard_sale_id, name, description, price, condition, status, images, created_at, updated_at, product_code
		FROM products
		WHERE id = ?
	`
	row := r.db.QueryRowContext(ctx, query, id)
	var prod domain.Product
	var imagesStr string
	var prodCode sql.NullString
	err := row.Scan(
		&prod.ID, &prod.YardSaleID, &prod.Name, &prod.Description, &prod.Price, &prod.Condition, &prod.Status, &imagesStr, &prod.CreatedAt, &prod.UpdatedAt, &prodCode,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch product: %w", err)
	}

	if err := json.Unmarshal([]byte(imagesStr), &prod.Images); err != nil {
		prod.Images = []string{}
	}
	if prodCode.Valid {
		prod.ProductCode = prodCode.String
	}
	return &prod, nil
}

func (r *SqliteRepository) FindProductsByYardSaleID(ctx context.Context, yardSaleID string) ([]*domain.Product, error) {
	query := `
		SELECT id, yard_sale_id, name, description, price, condition, status, images, created_at, updated_at, product_code
		FROM products
		WHERE yard_sale_id = ?
		ORDER BY created_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, yardSaleID)
	if err != nil {
		return nil, fmt.Errorf("failed to query products: %w", err)
	}
	defer rows.Close()

	var prods []*domain.Product
	for rows.Next() {
		var prod domain.Product
		var imagesStr string
		var prodCode sql.NullString
		err := rows.Scan(
			&prod.ID, &prod.YardSaleID, &prod.Name, &prod.Description, &prod.Price, &prod.Condition, &prod.Status, &imagesStr, &prod.CreatedAt, &prod.UpdatedAt, &prodCode,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}

		if err := json.Unmarshal([]byte(imagesStr), &prod.Images); err != nil {
			prod.Images = []string{}
		}
		if prodCode.Valid {
			prod.ProductCode = prodCode.String
		}

		prods = append(prods, &prod)
	}
	return prods, nil
}

func (r *SqliteRepository) FindProductByCodes(ctx context.Context, eventCode, productCode string) (*domain.Product, error) {
	query := `
		SELECT p.id, p.yard_sale_id, p.name, p.description, p.price, p.condition, p.status, p.images, p.created_at, p.updated_at, p.product_code
		FROM products p
		JOIN yard_sales ys ON p.yard_sale_id = ys.id
		WHERE (ys.event_code = ? OR ys.id = ?) AND (p.product_code = ? OR p.id = ?)
	`
	row := r.db.QueryRowContext(ctx, query, eventCode, eventCode, productCode, productCode)
	var prod domain.Product
	var imagesStr string
	var prodCode sql.NullString
	err := row.Scan(
		&prod.ID, &prod.YardSaleID, &prod.Name, &prod.Description, &prod.Price, &prod.Condition, &prod.Status, &imagesStr, &prod.CreatedAt, &prod.UpdatedAt, &prodCode,
	)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to fetch product by codes: %w", err)
	}

	if err := json.Unmarshal([]byte(imagesStr), &prod.Images); err != nil {
		prod.Images = []string{}
	}
	if prodCode.Valid {
		prod.ProductCode = prodCode.String
	}
	return &prod, nil
}
