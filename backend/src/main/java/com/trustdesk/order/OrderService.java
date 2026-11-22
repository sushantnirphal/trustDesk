package com.trustdesk.order;

import com.trustdesk.entity.Order;

import java.util.List;

public interface OrderService {

    List<Order> findAll();

    List<Order> findByCustomerId(Long customerId);

    Order findById(Long id);
}
